import crypto from 'crypto';
import { Readable } from 'stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { s3Client, s3Bucket, isS3Configured } from '../../config/s3';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { ZoomWebhookEvent, ZoomRecordingFile, RecordingQueryDTO } from './recording.types';

const FILE_TYPE_MAP: Record<string, string> = {
  MP4: 'VIDEO',
  M4A: 'AUDIO',
  CHAT: 'CHAT',
  TRANSCRIPT: 'TRANSCRIPT',
  CC: 'TRANSCRIPT',
  TXT: 'CHAT',
  VTT: 'TRANSCRIPT',
};

export class RecordingService {
  // ==========================================
  // WEBHOOK: Verify Zoom signature
  // ==========================================

  verifyWebhookSignature(rawBody: Buffer, timestamp: string, signature: string): boolean {
    if (!env.ZOOM_WEBHOOK_SECRET_TOKEN || env.ZOOM_WEBHOOK_SECRET_TOKEN === 'placeholder') {
      console.warn('ZOOM_WEBHOOK_SECRET_TOKEN not configured — rejecting webhook');
      return false;
    }

    // Anti-replay: reject timestamps older than 5 minutes
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum) || Math.abs(Date.now() / 1000 - timestampNum) > 300) {
      console.error('Zoom webhook timestamp too old or invalid');
      return false;
    }

    const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
    const hashForVerify = crypto
      .createHmac('sha256', env.ZOOM_WEBHOOK_SECRET_TOKEN)
      .update(message)
      .digest('hex');

    const expectedSignature = `v0=${hashForVerify}`;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // ==========================================
  // WEBHOOK: Handle URL validation challenge
  // ==========================================

  handleUrlValidation(plainToken: string): { plainToken: string; encryptedToken: string } {
    const encryptedToken = crypto
      .createHmac('sha256', env.ZOOM_WEBHOOK_SECRET_TOKEN || 'dev')
      .update(plainToken)
      .digest('hex');

    return { plainToken, encryptedToken };
  }

  // ==========================================
  // WEBHOOK: Process recording.completed
  // ==========================================

  async handleRecordingCompleted(event: ZoomWebhookEvent) {
    if (!event.payload?.object?.uuid || !event.payload?.object?.id) {
      console.error('Invalid recording.completed payload — missing uuid or id');
      return;
    }
    if (!event.payload.object.recording_files || !Array.isArray(event.payload.object.recording_files)) {
      console.error('Invalid recording.completed payload — missing recording_files');
      return;
    }

    const payload = event.payload.object;
    const meetingUuid = payload.uuid;

    // Idempotency: check if already processed
    const existing = await prisma.recording.findUnique({
      where: { zoomMeetingUuid: meetingUuid },
    });
    if (existing) {
      console.log(`Recording already exists for meeting ${meetingUuid} — skipping`);
      return;
    }

    // Find the enrollment session or demo booking by zoomMeetingId
    let zoomMeetingId: bigint;
    try {
      zoomMeetingId = BigInt(payload.id);
    } catch {
      console.error('Invalid meeting ID in webhook payload:', payload.id);
      return;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { zoomMeetingId },
      select: { id: true },
    });

    let enrollmentSessionId: string | null = null;
    let demoBookingId: string | null = null;

    if (enrollment) {
      // Find the most recent COMPLETED session for this enrollment
      const session = await prisma.enrollmentSession.findFirst({
        where: {
          enrollmentId: enrollment.id,
          status: 'COMPLETED',
          recording: null, // No recording yet
        },
        orderBy: { scheduledDate: 'desc' },
      });
      enrollmentSessionId = session?.id || null;
    } else {
      const demo = await prisma.demoBooking.findFirst({
        where: { zoomMeetingId },
        select: { id: true },
      });
      demoBookingId = demo?.id || null;
    }

    if (!enrollmentSessionId && !demoBookingId) {
      console.warn(`No matching session/demo for Zoom meeting ${payload.id} (UUID: ${meetingUuid})`);
      return;
    }

    // Create recording + files
    const recording = await prisma.recording.create({
      data: {
        enrollmentSessionId,
        demoBookingId,
        zoomMeetingId,
        zoomMeetingUuid: meetingUuid,
        meetingTopic: payload.topic,
        meetingDuration: payload.duration,
        status: 'PENDING',
      },
    });

    // Create file records for each recording file
    for (const file of payload.recording_files || []) {
      const fileType = FILE_TYPE_MAP[file.file_type] || FILE_TYPE_MAP[file.file_extension] || 'VIDEO';

      try {
        await prisma.recordingFile.create({
          data: {
            recordingId: recording.id,
            zoomFileId: file.id,
            fileType: fileType as any,
            fileExtension: file.file_extension || file.file_type,
            recordingType: file.recording_type,
            fileSizeBytes: BigInt(file.file_size),
            durationSeconds: file.recording_start && file.recording_end
              ? Math.round((new Date(file.recording_end).getTime() - new Date(file.recording_start).getTime()) / 1000)
              : null,
            zoomDownloadUrl: file.download_url,
            status: 'PENDING',
          },
        });
      } catch (err: any) {
        if (err.code === 'P2002') continue; // Duplicate — skip
        throw err;
      }
    }

    console.log(`Recording created: ${recording.id} with ${payload.recording_files?.length || 0} files`);
  }

  // ==========================================
  // CRON: Process pending recording files
  // ==========================================

  async processPendingFiles(): Promise<number> {
    const maxRetries = env.RECORDING_MAX_RETRIES || 3;

    // Step 1: Reset stale PROCESSING files (stuck > 10 min)
    await prisma.recordingFile.updateMany({
      where: {
        status: 'PROCESSING',
        processingStartedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
      },
      data: { status: 'PENDING', processingStartedAt: null },
    });

    // Step 2: Pick up pending/failed files
    const files = await prisma.recordingFile.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        retryCount: { lt: maxRetries },
      },
      orderBy: { createdAt: 'asc' },
      take: 3,
      include: {
        recording: {
          select: {
            id: true,
            zoomMeetingUuid: true,
            enrollmentSessionId: true,
            demoBookingId: true,
            enrollmentSession: { select: { enrollmentId: true } },
          },
        },
      },
    });

    let processed = 0;

    for (const file of files) {
      // Mark as processing
      await prisma.recordingFile.update({
        where: { id: file.id },
        data: { status: 'PROCESSING', processingStartedAt: new Date() },
      });

      try {
        const s3Key = this.buildS3Key(file);

        if (isS3Configured && s3Client) {
          // Real S3 upload: stream from Zoom → S3
          await this.streamToS3(file.zoomDownloadUrl, s3Key, file.fileExtension);

          await prisma.recordingFile.update({
            where: { id: file.id },
            data: {
              status: 'AVAILABLE',
              s3Key,
              s3Bucket: s3Bucket,
              completedAt: new Date(),
            },
          });
        } else {
          // Dev mode: simulate success
          console.log(`[DEV] Skipping S3 upload for file ${file.id} — using dummy key`);
          await prisma.recordingFile.update({
            where: { id: file.id },
            data: {
              status: 'AVAILABLE',
              s3Key: `dev/${file.recordingId}/${file.recordingType}.${file.fileExtension.toLowerCase()}`,
              s3Bucket: 'dev-bucket',
              completedAt: new Date(),
            },
          });
        }

        processed++;
      } catch (err: any) {
        console.error(`Recording file ${file.id} upload failed:`, err.message);
        await prisma.recordingFile.update({
          where: { id: file.id },
          data: {
            status: 'FAILED',
            retryCount: { increment: 1 },
            lastError: err.message?.slice(0, 500),
            processingStartedAt: null,
          },
        });
      }
    }

    // Step 3: Update parent Recording status when all files are done
    await this.updateRecordingStatuses();

    return processed;
  }

  // ==========================================
  // CRON: Cleanup Zoom recordings (2hr delay)
  // ==========================================

  async cleanupZoomRecordings(): Promise<number> {
    const recordings = await prisma.recording.findMany({
      where: {
        readyForZoomDeletion: { lt: new Date() },
        zoomDeletedAt: null,
      },
      take: 5,
    });

    let deleted = 0;
    for (const recording of recordings) {
      try {
        const { ZoomService } = await import('../zoom/zoom.service');
        const zoom = new ZoomService();
        await zoom.deleteRecording(recording.zoomMeetingUuid);

        await prisma.recording.update({
          where: { id: recording.id },
          data: { zoomDeletedAt: new Date() },
        });
        deleted++;
      } catch (err) {
        console.error(`Failed to delete Zoom recording ${recording.zoomMeetingUuid}:`, err);
      }
    }

    return deleted;
  }

  // ==========================================
  // CRON: Poll for missed recordings
  // ==========================================

  async pollMissedRecordings(): Promise<number> {
    // Find completed sessions from last 48hrs with no recording
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const sessions = await prisma.enrollmentSession.findMany({
      where: {
        status: 'COMPLETED',
        scheduledDate: { gte: cutoff },
        recording: null,
      },
      include: {
        enrollment: { select: { zoomMeetingId: true } },
      },
      take: 10,
    });

    // For now, just log — full Zoom API polling requires meeting UUID which we don't have per-session
    if (sessions.length > 0) {
      console.log(`[Recording Poll] Found ${sessions.length} completed sessions without recordings`);
    }

    return sessions.length;
  }

  // ==========================================
  // API: Get presigned URL for playback
  // ==========================================

  async getSessionRecordingUrl(sessionId: string, userId: string, role: string) {
    const session = await prisma.enrollmentSession.findUnique({
      where: { id: sessionId },
      include: {
        enrollment: { select: { parentId: true, tutorId: true } },
        recording: {
          include: {
            files: { where: { status: 'AVAILABLE', fileType: 'VIDEO' } },
          },
        },
      },
    });

    if (!session) throw ApiError.notFound('Session not found');

    // Auth check
    if (role === 'PARENT') {
      const parent = await prisma.parentProfile.findUnique({ where: { userId } });
      if (!parent || session.enrollment.parentId !== parent.id) throw ApiError.forbidden();
    } else if (role === 'TUTOR') {
      const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
      if (!tutor || session.enrollment.tutorId !== tutor.id) throw ApiError.forbidden();
    }

    if (!session.recording || session.recording.status !== 'AVAILABLE') {
      throw ApiError.notFound('Recording not available yet');
    }

    const files = await Promise.all(
      session.recording.files.map(async (file) => ({
        id: file.id,
        type: file.fileType,
        recordingType: file.recordingType,
        durationSeconds: file.durationSeconds,
        url: await this.getPresignedUrl(file.s3Key!, file.s3Bucket!, file.fileExtension),
      }))
    );

    return {
      recordingId: session.recording.id,
      meetingTopic: session.recording.meetingTopic,
      meetingDuration: session.recording.meetingDuration,
      files,
    };
  }

  async getDemoRecordingUrl(demoBookingId: string, userId: string, role: string) {
    const demo = await prisma.demoBooking.findUnique({
      where: { id: demoBookingId },
      include: {
        student: { select: { parentId: true } },
        tutor: { select: { userId: true } },
        consultant: { select: { userId: true } },
        recording: {
          include: {
            files: { where: { status: 'AVAILABLE', fileType: 'VIDEO' } },
          },
        },
      },
    });

    if (!demo) throw ApiError.notFound('Demo booking not found');

    // Auth: only the consultant, tutor, or parent of the student
    if (role === 'PARENT') {
      const parent = await prisma.parentProfile.findUnique({ where: { userId } });
      if (!parent || demo.student?.parentId !== parent.id) throw ApiError.forbidden();
    } else if (role === 'TUTOR') {
      if (demo.tutor.userId !== userId) throw ApiError.forbidden();
    } else if (role === 'CONSULTANT') {
      if (demo.consultant.userId !== userId) throw ApiError.forbidden();
    }

    if (!demo.recording || demo.recording.status !== 'AVAILABLE') {
      throw ApiError.notFound('Recording not available yet');
    }

    const files = await Promise.all(
      demo.recording.files.map(async (file) => ({
        id: file.id,
        type: file.fileType,
        recordingType: file.recordingType,
        durationSeconds: file.durationSeconds,
        url: await this.getPresignedUrl(file.s3Key!, file.s3Bucket!, file.fileExtension),
      }))
    );

    return {
      recordingId: demo.recording.id,
      meetingTopic: demo.recording.meetingTopic,
      meetingDuration: demo.recording.meetingDuration,
      files,
    };
  }

  // ==========================================
  // ADMIN: List all recordings
  // ==========================================
  // PARENT: List my recordings
  // ==========================================

  async getMyRecordings(userId: string, query: RecordingQueryDTO & { childId?: string; classType?: string }) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    // Validate childId belongs to this parent
    if (query.childId) {
      const child = await prisma.student.findFirst({
        where: { id: query.childId, parentId: parent.id, deletedAt: null },
      });
      if (!child) throw ApiError.forbidden('This child does not belong to you');
    }

    // Build where clause: recordings linked to this parent's enrollments
    const enrollmentWhere: Record<string, unknown> = { parentId: parent.id };
    if (query.childId) enrollmentWhere.studentId = query.childId;
    if (query.classType) enrollmentWhere.classType = query.classType;

    const where: Record<string, unknown> = {
      status: 'AVAILABLE',
      enrollmentSession: {
        enrollment: enrollmentWhere,
      },
    };

    const [recordings, total] = await Promise.all([
      prisma.recording.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          files: { where: { status: 'AVAILABLE', fileType: 'VIDEO' }, select: { id: true, durationSeconds: true } },
          enrollmentSession: {
            select: {
              id: true,
              scheduledDate: true,
              scheduledStart: true,
              scheduledEnd: true,
              enrollment: {
                select: {
                  id: true,
                  classType: true,
                  duration: true,
                  subject: { select: { name: true } },
                  tutor: { select: { firstName: true, lastName: true } },
                  student: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
      prisma.recording.count({ where }),
    ]);

    const data = recordings.map((r) => ({
      id: r.id,
      title: r.title || r.meetingTopic || r.enrollmentSession?.enrollment?.subject?.name || 'Class Recording',
      description: r.description,
      thumbnailUrl: r.thumbnailUrl,
      status: r.status,
      meetingDuration: r.meetingDuration,
      createdAt: r.createdAt,
      hasVideo: r.files.length > 0,
      session: r.enrollmentSession ? {
        id: r.enrollmentSession.id,
        scheduledDate: r.enrollmentSession.scheduledDate,
        scheduledStart: r.enrollmentSession.scheduledStart,
        scheduledEnd: r.enrollmentSession.scheduledEnd,
      } : null,
      enrollment: r.enrollmentSession?.enrollment ? {
        classType: r.enrollmentSession.enrollment.classType,
        duration: r.enrollmentSession.enrollment.duration,
        subject: r.enrollmentSession.enrollment.subject,
        tutor: r.enrollmentSession.enrollment.tutor,
        student: r.enrollmentSession.enrollment.student,
      } : null,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // TUTOR: List my recordings
  // ==========================================

  async getTutorRecordings(userId: string, query: RecordingQueryDTO & { classType?: string }) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const enrollmentWhere: Record<string, unknown> = { tutorId: tutor.id };
    if (query.classType) enrollmentWhere.classType = query.classType;

    const where: Record<string, unknown> = {
      status: 'AVAILABLE',
      enrollmentSession: {
        enrollment: enrollmentWhere,
      },
    };

    const [recordings, total] = await Promise.all([
      prisma.recording.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          files: { where: { status: 'AVAILABLE', fileType: 'VIDEO' }, select: { id: true, durationSeconds: true } },
          enrollmentSession: {
            select: {
              id: true,
              scheduledDate: true,
              scheduledStart: true,
              scheduledEnd: true,
              enrollment: {
                select: {
                  id: true,
                  classType: true,
                  duration: true,
                  subject: { select: { name: true } },
                  student: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
      prisma.recording.count({ where }),
    ]);

    const data = recordings.map((r) => ({
      id: r.id,
      title: r.title || r.meetingTopic || r.enrollmentSession?.enrollment?.subject?.name || 'Class Recording',
      description: r.description,
      thumbnailUrl: r.thumbnailUrl,
      status: r.status,
      meetingDuration: r.meetingDuration,
      createdAt: r.createdAt,
      hasVideo: r.files.length > 0,
      session: r.enrollmentSession ? {
        id: r.enrollmentSession.id,
        scheduledDate: r.enrollmentSession.scheduledDate,
        scheduledStart: r.enrollmentSession.scheduledStart,
        scheduledEnd: r.enrollmentSession.scheduledEnd,
      } : null,
      enrollment: r.enrollmentSession?.enrollment ? {
        classType: r.enrollmentSession.enrollment.classType,
        duration: r.enrollmentSession.enrollment.duration,
        subject: r.enrollmentSession.enrollment.subject,
        student: r.enrollmentSession.enrollment.student,
      } : null,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // ADMIN: List all recordings
  // ==========================================

  async listAllRecordings(query: RecordingQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [recordings, total] = await Promise.all([
      prisma.recording.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          files: { select: { id: true, fileType: true, status: true, fileSizeBytes: true } },
          enrollmentSession: {
            select: {
              scheduledDate: true,
              enrollment: {
                select: {
                  student: { select: { firstName: true, lastName: true } },
                  subject: { select: { name: true } },
                },
              },
            },
          },
          demoBooking: {
            select: {
              scheduledDate: true,
              subject: { select: { name: true } },
            },
          },
        },
      }),
      prisma.recording.count({ where }),
    ]);

    return { data: recordings, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // ADMIN: Retry a failed recording
  // ==========================================

  async retryRecording(recordingId: string) {
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      include: { files: true },
    });
    if (!recording) throw ApiError.notFound('Recording not found');

    await prisma.recordingFile.updateMany({
      where: { recordingId, status: 'FAILED' },
      data: { status: 'PENDING', retryCount: 0, lastError: null, processingStartedAt: null },
    });

    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: 'PENDING' },
    });

    return { message: 'Recording queued for retry' };
  }

  // ==========================================
  // PRIVATE HELPERS
  // ==========================================

  private buildS3Key(file: {
    recording: {
      enrollmentSessionId: string | null;
      demoBookingId: string | null;
      enrollmentSession: { enrollmentId: string } | null;
    };
    recordingType: string;
    fileExtension: string;
    recordingId: string;
  }): string {
    const ext = file.fileExtension.toLowerCase();
    const type = file.recordingType.replace(/\s+/g, '_');

    if (file.recording.enrollmentSessionId && file.recording.enrollmentSession) {
      return `enrollments/${file.recording.enrollmentSession.enrollmentId}/${file.recording.enrollmentSessionId}/${type}.${ext}`;
    }
    if (file.recording.demoBookingId) {
      return `demos/${file.recording.demoBookingId}/${type}.${ext}`;
    }
    return `unknown/${file.recordingId}/${type}.${ext}`;
  }

  private async streamToS3(zoomDownloadUrl: string, s3Key: string, fileExtension: string): Promise<void> {
    // Get Zoom access token for download
    const { ZoomService } = await import('../zoom/zoom.service');
    const zoom = new ZoomService();
    const token = await (zoom as any).getAccessToken();

    // Stream download from Zoom with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 min timeout

    try {
      const response = await fetch(`${zoomDownloadUrl}?access_token=${token}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Zoom download failed (${response.status}): ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Zoom download returned empty body');
      }

      // Convert web ReadableStream to Node Readable
      const nodeStream = Readable.fromWeb(response.body as any);

      // Determine content type
      const contentTypeMap: Record<string, string> = {
        MP4: 'video/mp4',
        M4A: 'audio/mp4',
        TXT: 'text/plain',
        VTT: 'text/vtt',
      };
      const contentType = contentTypeMap[fileExtension.toUpperCase()] || 'application/octet-stream';

      // Streaming multipart upload to S3
      const upload = new Upload({
        client: s3Client!,
        params: {
          Bucket: s3Bucket,
          Key: s3Key,
          Body: nodeStream,
          ContentType: contentType,
          ContentDisposition: 'inline', // Force browser to play, not download
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024, // 10MB parts
      });

      await upload.done();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getPresignedUrl(s3Key: string, bucket: string, fileExtension: string): Promise<string> {
    if (!s3Client || !isS3Configured) {
      // Dev mode: return placeholder
      return `https://dev-placeholder.local/${s3Key}`;
    }

    const contentTypeMap: Record<string, string> = {
      MP4: 'video/mp4',
      M4A: 'audio/mp4',
      TXT: 'text/plain',
      VTT: 'text/vtt',
    };
    const contentType = contentTypeMap[fileExtension.toUpperCase()] || 'application/octet-stream';

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ResponseContentDisposition: 'inline',
      ResponseContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  }

  private async updateRecordingStatuses() {
    // Find recordings where all files are AVAILABLE but recording is not
    const recordings = await prisma.recording.findMany({
      where: { status: { not: 'AVAILABLE' } },
      include: { files: true },
    });

    for (const recording of recordings) {
      if (recording.files.length === 0) continue;

      const allAvailable = recording.files.every((f) => f.status === 'AVAILABLE');
      if (allAvailable) {
        await prisma.recording.update({
          where: { id: recording.id },
          data: {
            status: 'AVAILABLE',
            readyForZoomDeletion: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          },
        });
        console.log(`Recording ${recording.id} fully available — queued for Zoom deletion in 2hrs`);
      }

      const anyFailed = recording.files.some((f) => f.status === 'FAILED' && f.retryCount >= (env.RECORDING_MAX_RETRIES || 3));
      if (anyFailed) {
        await prisma.recording.update({
          where: { id: recording.id },
          data: { status: 'FAILED' },
        });
      }
    }
  }
}
