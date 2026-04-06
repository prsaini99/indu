import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { computeBalance } from '../../shared/utils/credit';
import { addMinutesToTime, formatDateUTC } from '../../shared/utils/time';
import { CreateBatchDTO, UpdateBatchDTO, JoinBatchDTO, BatchQueryDTO } from './batch.types';

const batchInclude = {
  subject: { select: { id: true, name: true } },
  tutor: { select: { id: true, firstName: true, lastName: true, userId: true } },
  grade: { select: { id: true, name: true } },
  students: {
    where: { isActive: true },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      parent: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } },
    },
  },
} as const;

export class BatchService {
  // ==========================================
  // HELPERS
  // ==========================================

  private async getActiveStudentCount(batchId: string): Promise<number> {
    return prisma.batchStudent.count({ where: { batchId, isActive: true } });
  }

  // ==========================================
  // ADMIN: CREATE BATCH
  // ==========================================

  async create(data: CreateBatchDTO) {
    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject || !subject.isActive) throw ApiError.notFound('Subject not found or inactive');

    const tutor = await prisma.tutorProfile.findUnique({ where: { id: data.tutorId } });
    if (!tutor || !tutor.isActive) throw ApiError.notFound('Tutor not found or inactive');

    const grade = await prisma.gradeLevel.findUnique({ where: { id: data.gradeId } });
    if (!grade) throw ApiError.notFound('Grade level not found');

    const batch = await prisma.batch.create({
      data: {
        name: data.name,
        description: data.description,
        subjectId: data.subjectId,
        tutorId: data.tutorId,
        gradeId: data.gradeId,
        schedule: data.schedule as unknown as Prisma.InputJsonValue,
        duration: data.duration,
        minStudents: data.minStudents || 1,
        maxStudents: data.maxStudents || 6,
        creditsPerSession: data.creditsPerSession,
        startDate: data.startDate ? new Date(data.startDate) : null,
      },
      include: batchInclude,
    });

    // Auto-create Zoom meeting (non-blocking)
    try {
      const { ZoomService } = await import('../zoom/zoom.service');
      const zoom = new ZoomService();
      const meeting = await zoom.createRecurringMeeting(
        `${subject.name} — ${batch.name}`,
        data.duration,
        'Asia/Dubai'
      );
      await prisma.batch.update({
        where: { id: batch.id },
        data: { zoomLink: meeting.joinUrl, zoomPassword: meeting.password, zoomMeetingId: meeting.meetingId },
      });
    } catch (err) {
      console.error('Zoom meeting creation failed for batch (non-blocking):', err);
    }

    return batch;
  }

  // ==========================================
  // ADMIN: LIST ALL BATCHES
  // ==========================================

  async listAll(query: BatchQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.gradeId) where.gradeId = query.gradeId;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ...batchInclude,
          _count: { select: { students: { where: { isActive: true } } } },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    return { data: batches, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // ADMIN: GET BY ID
  // ==========================================

  async getById(batchId: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        ...batchInclude,
        sessions: {
          orderBy: { scheduledDate: 'desc' },
          take: 20,
        },
      },
    });
    if (!batch) throw ApiError.notFound('Batch not found');
    return batch;
  }

  // ==========================================
  // ADMIN: UPDATE BATCH (only when OPEN)
  // ==========================================

  async update(batchId: string, data: UpdateBatchDTO) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw ApiError.notFound('Batch not found');
    if (batch.status !== 'OPEN' && batch.status !== 'FULL') {
      throw ApiError.badRequest('INVALID_STATUS', 'Can only update batches that are OPEN or FULL');
    }

    return prisma.batch.update({
      where: { id: batchId },
      data: {
        ...data,
        schedule: data.schedule ? (data.schedule as unknown as Prisma.InputJsonValue) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
      },
      include: batchInclude,
    });
  }

  // ==========================================
  // ADMIN: START BATCH
  // ==========================================

  async startBatch(batchId: string) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw ApiError.notFound('Batch not found');
    if (batch.status !== 'OPEN' && batch.status !== 'FULL') {
      throw ApiError.badRequest('INVALID_STATUS', 'Can only start OPEN or FULL batches');
    }

    const studentCount = await this.getActiveStudentCount(batchId);
    if (studentCount < batch.minStudents) {
      throw ApiError.badRequest('MIN_STUDENTS', `Need at least ${batch.minStudents} students to start. Currently: ${studentCount}`);
    }

    const updated = await prisma.batch.update({
      where: { id: batchId },
      data: { status: 'ACTIVE', startDate: batch.startDate || new Date() },
      include: batchInclude,
    });

    // Generate initial sessions
    await this.generateBatchSessions(batchId);

    return updated;
  }

  // ==========================================
  // ADMIN: CANCEL BATCH
  // ==========================================

  async cancelBatch(batchId: string, reason?: string) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw ApiError.notFound('Batch not found');
    if (batch.status === 'CANCELLED') throw ApiError.badRequest('INVALID_STATUS', 'Batch is already cancelled');

    // Refund future sessions for all students
    await this.refundBatchFutureSessions(batchId);

    // Delete Zoom meeting
    if (batch.zoomMeetingId) {
      try {
        const { ZoomService } = await import('../zoom/zoom.service');
        const zoom = new ZoomService();
        await zoom.deleteMeeting(batch.zoomMeetingId);
      } catch (err) {
        console.error('Zoom delete failed for batch (non-blocking):', err);
      }
    }

    return prisma.batch.update({
      where: { id: batchId },
      data: { status: 'CANCELLED', zoomLink: null, zoomPassword: null, zoomMeetingId: null },
      include: batchInclude,
    });
  }

  // ==========================================
  // ADMIN: REMOVE STUDENT
  // ==========================================

  async removeStudent(batchId: string, studentId: string, reason?: string) {
    const batchStudent = await prisma.batchStudent.findUnique({
      where: { batchId_studentId: { batchId, studentId } },
    });
    if (!batchStudent || !batchStudent.isActive) throw ApiError.notFound('Student not in this batch');

    await prisma.batchStudent.update({
      where: { id: batchStudent.id },
      data: { isActive: false, leftAt: new Date(), leaveReason: reason || 'Removed by admin' },
    });

    // If batch was FULL, set back to OPEN
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (batch && batch.status === 'FULL') {
      await prisma.batch.update({ where: { id: batchId }, data: { status: 'OPEN' } });
    }

    return { message: 'Student removed from batch' };
  }

  // ==========================================
  // PARENT: BROWSE AVAILABLE BATCHES
  // ==========================================

  async listAvailable(query: BatchQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: Record<string, unknown> = { status: { in: ['OPEN'] } };
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.gradeId) where.gradeId = query.gradeId;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: { select: { id: true, name: true } },
          tutor: { select: { id: true, firstName: true, lastName: true, bio: true, profilePhotoUrl: true } },
          grade: { select: { id: true, name: true } },
          _count: { select: { students: { where: { isActive: true } } } },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    return { data: batches, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // PARENT: JOIN BATCH
  // ==========================================

  async joinBatch(batchId: string, userId: string, data: JoinBatchDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw ApiError.notFound('Batch not found');
    if (batch.status !== 'OPEN') {
      throw ApiError.badRequest('INVALID_STATUS', batch.status === 'FULL' ? 'This batch is full' : 'This batch is not accepting students');
    }

    // Validate student belongs to parent and grade matches
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, parentId: parent.id, deletedAt: null },
    });
    if (!student) throw ApiError.notFound('Student not found or does not belong to you');
    if (student.gradeId !== batch.gradeId) {
      throw ApiError.badRequest('GRADE_MISMATCH', 'Student grade does not match batch grade');
    }

    // Check not already in batch
    const existing = await prisma.batchStudent.findUnique({
      where: { batchId_studentId: { batchId, studentId: data.studentId } },
    });
    if (existing && existing.isActive) {
      throw ApiError.conflict('ALREADY_JOINED', 'Student is already in this batch');
    }

    // Credit check: at least 4 sessions' worth
    const minCredits = batch.creditsPerSession * 4;
    const balance = await computeBalance(parent.id);
    if (balance < minCredits) {
      throw ApiError.badRequest('INSUFFICIENT_CREDITS', `Need at least ${minCredits} credits to join. Current balance: ${balance}`);
    }

    // Create or reactivate BatchStudent
    if (existing) {
      await prisma.batchStudent.update({
        where: { id: existing.id },
        data: { isActive: true, leftAt: null, leaveReason: null, joinedAt: new Date() },
      });
    } else {
      await prisma.batchStudent.create({
        data: { batchId, studentId: data.studentId, parentId: parent.id },
      });
    }

    // Check if batch is now full
    const count = await this.getActiveStudentCount(batchId);
    if (count >= batch.maxStudents) {
      await prisma.batch.update({ where: { id: batchId }, data: { status: 'FULL' } });
    }

    // Notify parent + tutor (non-blocking)
    try {
      const { NotificationService } = await import('../notification/notification.service');
      const { batchJoinedParent, batchJoinedTutor } = await import('../notification/templates/event-templates');
      const ns = new NotificationService();
      const parentUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
      const tutorProfile = await prisma.tutorProfile.findUnique({ where: { id: batch.tutorId }, include: { user: { select: { id: true, email: true } } } });
      const studentRecord = await prisma.student.findUnique({ where: { id: data.studentId }, select: { firstName: true, lastName: true } });
      if (parentUser && studentRecord) {
        const pTemplate = batchJoinedParent(`${studentRecord.firstName} ${studentRecord.lastName}`, batch.name);
        await ns.send({ userId: parentUser.id, userEmail: parentUser.email, type: 'BATCH_JOINED', ...pTemplate, emailHtml: pTemplate.html });
      }
      if (tutorProfile && studentRecord) {
        const tTemplate = batchJoinedTutor(`${studentRecord.firstName} ${studentRecord.lastName}`, batch.name);
        await ns.send({ userId: tutorProfile.user.id, userEmail: tutorProfile.user.email, type: 'BATCH_JOINED', ...tTemplate, emailHtml: tTemplate.html });
      }
    } catch (err) {
      console.error('Batch join notification failed (non-blocking):', err);
    }

    return { message: 'Successfully joined the batch', spotsRemaining: batch.maxStudents - count };
  }

  // ==========================================
  // PARENT: LEAVE BATCH
  // ==========================================

  async leaveBatch(batchId: string, userId: string, studentId: string) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const batchStudent = await prisma.batchStudent.findUnique({
      where: { batchId_studentId: { batchId, studentId } },
    });
    if (!batchStudent || !batchStudent.isActive) throw ApiError.notFound('Student not in this batch');
    if (batchStudent.parentId !== parent.id) throw ApiError.forbidden('Not your child');

    await prisma.batchStudent.update({
      where: { id: batchStudent.id },
      data: { isActive: false, leftAt: new Date(), leaveReason: 'Left by parent' },
    });

    // If batch was FULL, set back to OPEN
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (batch && batch.status === 'FULL') {
      await prisma.batch.update({ where: { id: batchId }, data: { status: 'OPEN' } });
    }

    return { message: 'Left the batch successfully' };
  }

  // ==========================================
  // PARENT: MY BATCHES
  // ==========================================

  async listMyBatches(userId: string, query: BatchQueryDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const batchStudents = await prisma.batchStudent.findMany({
      where: { parentId: parent.id, isActive: true },
      select: { batchId: true },
    });
    const batchIds = batchStudents.map((bs) => bs.batchId);

    if (batchIds.length === 0) return { data: [], meta: buildPaginationMeta(1, limit, 0) };

    const where: Record<string, unknown> = { id: { in: batchIds } };
    if (query.status) where.status = query.status;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: { select: { id: true, name: true } },
          tutor: { select: { id: true, firstName: true, lastName: true } },
          grade: { select: { id: true, name: true } },
          _count: { select: { students: { where: { isActive: true } } } },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    return { data: batches, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // PARENT: BATCH DETAIL
  // ==========================================

  async getBatchDetail(batchId: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        subject: { select: { id: true, name: true } },
        tutor: { select: { id: true, firstName: true, lastName: true, bio: true, profilePhotoUrl: true, experience: true } },
        grade: { select: { id: true, name: true } },
        students: {
          where: { isActive: true },
          select: { student: { select: { id: true, firstName: true, lastName: true } } },
        },
        sessions: {
          where: { status: { in: ['CONFIRMED', 'SCHEDULED'] }, scheduledDate: { gte: new Date() } },
          orderBy: { scheduledDate: 'asc' },
          take: 5,
        },
        _count: { select: { students: { where: { isActive: true } } } },
      },
    });
    if (!batch) throw ApiError.notFound('Batch not found');
    return batch;
  }

  // ==========================================
  // TUTOR: MY BATCHES
  // ==========================================

  async listForTutor(userId: string, query: BatchQueryDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: Record<string, unknown> = { tutorId: tutor.id };
    if (query.status) where.status = query.status;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ...batchInclude,
          _count: { select: { students: { where: { isActive: true } } } },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    return { data: batches, meta: buildPaginationMeta(page, limit, total) };
  }

  async getTutorBatchDetail(batchId: string, userId: string) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        ...batchInclude,
        sessions: {
          orderBy: { scheduledDate: 'desc' },
          take: 20,
        },
      },
    });
    if (!batch || batch.tutorId !== tutor.id) throw ApiError.forbidden('Not your batch');
    return batch;
  }

  // ==========================================
  // SESSION GENERATION (Cron)
  // ==========================================

  async generateBatchSessions(batchId: string): Promise<number> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { students: { where: { isActive: true } } },
    });
    if (!batch || batch.status !== 'ACTIVE') return 0;

    const schedule = batch.schedule as { dayOfWeek: number; startTime: string }[];
    if (!schedule || schedule.length === 0) return 0;

    const dayTimeMap = new Map<number, string>();
    for (const slot of schedule) dayTimeMap.set(slot.dayOfWeek, slot.startTime);

    const today = new Date();
    const todayStr = formatDateUTC(today);
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + 7);

    const startFrom = batch.lastGeneratedDate
      ? new Date(new Date(batch.lastGeneratedDate).getTime() + 86400000)
      : today;

    if (startFrom > windowEnd) return 0;

    const existing = await prisma.batchSession.findMany({
      where: { batchId, scheduledDate: { gte: startFrom, lte: windowEnd } },
      select: { scheduledDate: true },
    });
    const existingDates = new Set(existing.map((s) => formatDateUTC(s.scheduledDate)));

    let sessionsCreated = 0;
    let lastDate = batch.lastGeneratedDate;
    const currentDate = new Date(startFrom);

    while (currentDate <= windowEnd) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = formatDateUTC(currentDate);
      const slotTime = dayTimeMap.get(dayOfWeek);

      if (slotTime && !existingDates.has(dateStr)) {
        const endTime = addMinutesToTime(slotTime, batch.duration);

        // Skip if today's slot already passed
        if (dateStr === todayStr) {
          const [slotH, slotM] = slotTime.split(':').map(Number);
          const nowMinutes = today.getUTCHours() * 60 + today.getUTCMinutes();
          if (nowMinutes >= slotH * 60 + slotM) {
            lastDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }
        }

        try {
          const session = await prisma.batchSession.create({
            data: {
              batchId,
              status: 'CONFIRMED',
              scheduledDate: new Date(dateStr + 'T12:00:00Z'),
              scheduledStart: slotTime,
              scheduledEnd: endTime,
            },
          });

          // Deduct credits for each active student
          for (const bs of batch.students) {
            const balance = await computeBalance(bs.parentId);
            if (balance >= batch.creditsPerSession) {
              const bsc = await prisma.batchSessionCredit.create({
                data: {
                  batchSessionId: session.id,
                  parentId: bs.parentId,
                  studentId: bs.studentId,
                  creditsCharged: batch.creditsPerSession,
                  creditDeductedAt: new Date(),
                },
              });

              await prisma.creditTransaction.create({
                data: {
                  parentId: bs.parentId,
                  type: 'DEDUCTION',
                  amount: batch.creditsPerSession,
                  description: `Group class — ${batch.name} — ${dateStr}`,
                  batchSessionCreditId: bsc.id,
                },
              });
            } else {
              console.warn(`Insufficient credits for student ${bs.studentId} in batch ${batchId}`);
            }
          }

          sessionsCreated++;
        } catch (err: any) {
          if (err.code === 'P2002') { /* duplicate — skip */ }
          else throw err;
        }
      }

      lastDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (lastDate) {
      await prisma.batch.update({ where: { id: batchId }, data: { lastGeneratedDate: lastDate } });
    }

    return sessionsCreated;
  }

  async generateAllActiveBatchSessions(): Promise<number> {
    const batches = await prisma.batch.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    let total = 0;
    for (const batch of batches) {
      total += await this.generateBatchSessions(batch.id);
    }
    return total;
  }

  async completePastBatchSessions(): Promise<number> {
    const now = new Date();
    const sessions = await prisma.batchSession.findMany({
      where: { status: 'CONFIRMED', scheduledDate: { lte: now } },
      select: { id: true, scheduledDate: true, scheduledEnd: true },
    });

    let completed = 0;
    for (const session of sessions) {
      const dateStr = formatDateUTC(session.scheduledDate);
      const endParts = session.scheduledEnd.split(':').map(Number);
      const sessionEnd = new Date(dateStr + 'T' + session.scheduledEnd + ':00Z');
      if (now > sessionEnd) {
        await prisma.batchSession.update({
          where: { id: session.id },
          data: { status: 'COMPLETED' },
        });
        completed++;
      }
    }
    return completed;
  }

  // ==========================================
  // HELPER: Refund future batch sessions
  // ==========================================

  private async refundBatchFutureSessions(batchId: string) {
    const now = new Date();
    const cutoff = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');

    const futureSessions = await prisma.batchSession.findMany({
      where: {
        batchId,
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
        scheduledDate: { gte: cutoff },
      },
      include: {
        creditDeductions: {
          select: { id: true, parentId: true, creditsCharged: true },
        },
      },
    });

    for (const session of futureSessions) {
      for (const credit of session.creditDeductions) {
        if (credit.creditsCharged > 0) {
          await prisma.creditTransaction.create({
            data: {
              parentId: credit.parentId,
              type: 'ADMIN_ADJUSTMENT',
              amount: credit.creditsCharged,
              description: `Refund (batch cancelled): ${formatDateUTC(session.scheduledDate)}`,
            },
          });
        }
      }
    }

    // Delete future sessions
    if (futureSessions.length > 0) {
      await prisma.batchSession.deleteMany({
        where: { id: { in: futureSessions.map((s) => s.id) } },
      });
    }
  }

  // ==========================================
  // PARENT: COURSE MATERIALS
  // ==========================================

  async getCourseMaterials(batchId: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { subjectId: true, gradeId: true, subject: { select: { name: true } } },
    });

    if (!batch) throw ApiError.notFound('Batch not found');

    const course = await prisma.course.findUnique({
      where: { subjectId_gradeId: { subjectId: batch.subjectId, gradeId: batch.gradeId } },
      select: {
        id: true,
        name: true,
        materials: {
          select: { id: true, title: true, fileUrl: true, fileType: true, fileSizeKb: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return {
      courseName: course?.name || batch.subject.name,
      materials: course?.materials || [],
    };
  }
}
