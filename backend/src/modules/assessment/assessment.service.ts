import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { s3Client, s3Bucket, isS3Configured } from '../../config/s3';
import {
  CreateAssessmentResultDTO,
  UpdateAssessmentResultDTO,
  AssessmentQueryDTO,
  UploadDocumentDTO,
  ProgressQueryDTO,
} from './assessment.types';
import { v4 as uuidv4 } from 'uuid';

export class AssessmentService {
  // ==========================================
  // TUTOR: CREATE ASSESSMENT RESULT
  // ==========================================

  async create(userId: string, data: CreateAssessmentResultDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    // Validate student exists
    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) throw ApiError.notFound('Student not found');

    // Validate subject exists
    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) throw ApiError.notFound('Subject not found');

    // Validate tutor teaches this student (has an active enrollment)
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        tutorId: tutor.id,
        studentId: data.studentId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
    });
    if (!enrollment) {
      throw ApiError.forbidden('You can only upload results for students you are currently teaching');
    }

    // If enrollmentId provided, validate it belongs to this tutor+student
    if (data.enrollmentId) {
      const linkedEnrollment = await prisma.enrollment.findUnique({ where: { id: data.enrollmentId } });
      if (!linkedEnrollment || linkedEnrollment.tutorId !== tutor.id || linkedEnrollment.studentId !== data.studentId) {
        throw ApiError.badRequest('INVALID_ENROLLMENT', 'Enrollment does not match tutor/student');
      }
    }

    const maxScore = data.maxScore ?? 100;
    const percentage = (data.score / maxScore) * 100;

    const result = await prisma.assessmentResult.create({
      data: {
        studentId: data.studentId,
        tutorId: tutor.id,
        subjectId: data.subjectId,
        enrollmentId: data.enrollmentId,
        title: data.title,
        score: data.score,
        maxScore,
        percentage,
        remarks: data.remarks,
        assessedAt: new Date(data.assessedAt),
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        subject: { select: { name: true } },
      },
    });

    return {
      id: result.id,
      title: result.title,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      remarks: result.remarks,
      assessedAt: result.assessedAt,
      studentName: `${result.student.firstName} ${result.student.lastName}`,
      subject: result.subject.name,
      createdAt: result.createdAt,
    };
  }

  // ==========================================
  // TUTOR: GET MY STUDENTS (for assessment form dropdown)
  // ==========================================

  async getMyStudents(userId: string) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    // Get all active/paused enrollments for this tutor with student + subject info
    const enrollments = await prisma.enrollment.findMany({
      where: { tutorId: tutor.id, status: { in: ['ACTIVE', 'PAUSED'] } },
      select: {
        id: true,
        student: { select: { id: true, firstName: true, lastName: true } },
        subject: { select: { id: true, name: true } },
      },
    });

    // Also check batch students
    const batches = await prisma.batch.findMany({
      where: { tutorId: tutor.id, status: { in: ['OPEN', 'FULL', 'ACTIVE'] } },
      select: {
        id: true,
        subject: { select: { id: true, name: true } },
        students: {
          where: { isActive: true },
          select: { student: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    // Build unique student → subjects map
    const studentMap = new Map<string, { id: string; firstName: string; lastName: string; subjects: Map<string, string> }>();

    for (const e of enrollments) {
      if (!studentMap.has(e.student.id)) {
        studentMap.set(e.student.id, { ...e.student, subjects: new Map() });
      }
      studentMap.get(e.student.id)!.subjects.set(e.subject.id, e.subject.name);
    }

    for (const b of batches) {
      for (const bs of b.students) {
        if (!studentMap.has(bs.student.id)) {
          studentMap.set(bs.student.id, { ...bs.student, subjects: new Map() });
        }
        studentMap.get(bs.student.id)!.subjects.set(b.subject.id, b.subject.name);
      }
    }

    return [...studentMap.values()].map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      subjects: [...s.subjects.entries()].map(([id, name]) => ({ id, name })),
    }));
  }

  // ==========================================
  // TUTOR: LIST OWN RESULTS
  // ==========================================

  async list(userId: string, query: AssessmentQueryDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { tutorId: tutor.id };
    if (query.studentId) where.studentId = query.studentId;
    if (query.subjectId) where.subjectId = query.subjectId;

    const [results, total] = await Promise.all([
      prisma.assessmentResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assessedAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true } },
          subject: { select: { name: true } },
          documents: { select: { id: true, title: true, fileType: true } },
        },
      }),
      prisma.assessmentResult.count({ where }),
    ]);

    const data = results.map((r) => ({
      id: r.id,
      title: r.title,
      score: r.score,
      maxScore: r.maxScore,
      percentage: r.percentage,
      remarks: r.remarks,
      assessedAt: r.assessedAt,
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      subject: r.subject.name,
      documentsCount: r.documents.length,
      createdAt: r.createdAt,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // TUTOR/PARENT: GET BY ID
  // ==========================================

  async getById(resultId: string, userId: string, role: string) {
    const result = await prisma.assessmentResult.findUnique({
      where: { id: resultId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, parentId: true } },
        subject: { select: { name: true } },
        tutor: { select: { id: true, firstName: true, lastName: true, userId: true } },
        documents: true,
      },
    });

    if (!result) throw ApiError.notFound('Assessment result not found');

    // Authorization
    if (role === 'TUTOR' && result.tutor.userId !== userId) {
      throw ApiError.forbidden('Access denied');
    }
    if (role === 'PARENT') {
      const parent = await prisma.parentProfile.findUnique({ where: { userId } });
      if (!parent || result.student.parentId !== parent.id) {
        throw ApiError.forbidden('Access denied');
      }
    }

    return {
      id: result.id,
      title: result.title,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      remarks: result.remarks,
      assessedAt: result.assessedAt,
      studentName: `${result.student.firstName} ${result.student.lastName}`,
      tutorName: `${result.tutor.firstName} ${result.tutor.lastName}`,
      subject: result.subject.name,
      documents: result.documents.map((d) => ({
        id: d.id,
        title: d.title,
        fileType: d.fileType,
        fileSizeKb: d.fileSizeKb,
        createdAt: d.createdAt,
      })),
      createdAt: result.createdAt,
    };
  }

  // ==========================================
  // TUTOR: UPDATE RESULT
  // ==========================================

  async update(userId: string, resultId: string, data: UpdateAssessmentResultDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const result = await prisma.assessmentResult.findUnique({ where: { id: resultId } });
    if (!result) throw ApiError.notFound('Assessment result not found');
    if (result.tutorId !== tutor.id) throw ApiError.forbidden('Access denied');

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;
    if (data.assessedAt !== undefined) updateData.assessedAt = new Date(data.assessedAt);

    // Recompute percentage if score or maxScore changed
    const newScore = data.score ?? result.score;
    const newMaxScore = data.maxScore ?? result.maxScore;
    if (data.score !== undefined || data.maxScore !== undefined) {
      updateData.score = newScore;
      updateData.maxScore = newMaxScore;
      updateData.percentage = (newScore / newMaxScore) * 100;
    }

    const updated = await prisma.assessmentResult.update({
      where: { id: resultId },
      data: updateData,
    });

    return {
      id: updated.id,
      title: updated.title,
      score: updated.score,
      maxScore: updated.maxScore,
      percentage: updated.percentage,
      remarks: updated.remarks,
      assessedAt: updated.assessedAt,
    };
  }

  // ==========================================
  // TUTOR: DELETE RESULT
  // ==========================================

  async delete(userId: string, resultId: string) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const result = await prisma.assessmentResult.findUnique({
      where: { id: resultId },
      include: { documents: { select: { id: true, fileUrl: true } } },
    });
    if (!result) throw ApiError.notFound('Assessment result not found');
    if (result.tutorId !== tutor.id) throw ApiError.forbidden('Access denied');

    // Clean up S3 files before deleting DB records (non-blocking)
    if (result.documents.length > 0) {
      try {
        const { s3Client, isS3Configured } = await import('../../config/s3');
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        if (isS3Configured && s3Client) {
          for (const doc of result.documents) {
            if (doc.fileUrl) {
              // Extract S3 key from URL
              const key = doc.fileUrl.includes('.amazonaws.com/')
                ? doc.fileUrl.split('.amazonaws.com/')[1]
                : doc.fileUrl;
              await s3Client.send(new DeleteObjectCommand({
                Bucket: (await import('../../config/s3')).s3Bucket,
                Key: key,
              }));
            }
          }
        }
      } catch (err) {
        console.error('S3 cleanup failed on assessment delete (non-blocking):', err);
      }
    }

    await prisma.assessmentResult.delete({ where: { id: resultId } });
    return { deleted: true };
  }

  // ==========================================
  // TUTOR: UPLOAD DOCUMENT (S3 pre-signed URL)
  // ==========================================

  async generateUploadUrl(userId: string, resultId: string, data: UploadDocumentDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const result = await prisma.assessmentResult.findUnique({ where: { id: resultId } });
    if (!result) throw ApiError.notFound('Assessment result not found');
    if (result.tutorId !== tutor.id) throw ApiError.forbidden('Access denied');

    const fileKey = `assessments/${resultId}/${uuidv4()}.${data.fileType}`;

    // Create document record
    const doc = await prisma.assessmentDocument.create({
      data: {
        assessmentResultId: resultId,
        title: data.title,
        fileUrl: fileKey,
        fileType: data.fileType,
      },
    });

    // Generate pre-signed PUT URL if S3 is configured
    let uploadUrl: string | null = null;
    if (isS3Configured && s3Client) {
      const command = new PutObjectCommand({
        Bucket: s3Bucket,
        Key: fileKey,
        ContentType: `application/${data.fileType}`,
      });
      uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }

    return {
      documentId: doc.id,
      uploadUrl,
      fileKey,
    };
  }

  // ==========================================
  // TUTOR: DELETE DOCUMENT
  // ==========================================

  async deleteDocument(userId: string, resultId: string, docId: string) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const result = await prisma.assessmentResult.findUnique({ where: { id: resultId } });
    if (!result) throw ApiError.notFound('Assessment result not found');
    if (result.tutorId !== tutor.id) throw ApiError.forbidden('Access denied');

    const doc = await prisma.assessmentDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.assessmentResultId !== resultId) throw ApiError.notFound('Document not found');

    // Delete from S3
    if (isS3Configured && s3Client) {
      try {
        const command = new DeleteObjectCommand({ Bucket: s3Bucket, Key: doc.fileUrl });
        await s3Client.send(command);
      } catch (err) {
        console.error(`Failed to delete S3 object ${doc.fileUrl}:`, err);
      }
    }

    await prisma.assessmentDocument.delete({ where: { id: docId } });
    return { deleted: true };
  }

  // ==========================================
  // PARENT: DOWNLOAD DOCUMENT (pre-signed URL)
  // ==========================================

  async getDownloadUrl(userId: string, resultId: string, docId: string) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const result = await prisma.assessmentResult.findUnique({
      where: { id: resultId },
      include: { student: { select: { parentId: true } } },
    });
    if (!result) throw ApiError.notFound('Assessment result not found');
    if (result.student.parentId !== parent.id) throw ApiError.forbidden('Access denied');

    const doc = await prisma.assessmentDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.assessmentResultId !== resultId) throw ApiError.notFound('Document not found');

    if (!isS3Configured || !s3Client) {
      return { downloadUrl: null, message: 'S3 not configured' };
    }

    const command = new GetObjectCommand({ Bucket: s3Bucket, Key: doc.fileUrl });
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return { downloadUrl, title: doc.title, fileType: doc.fileType };
  }

  // ==========================================
  // PARENT: LIST CHILD'S RESULTS
  // ==========================================

  async getChildResults(userId: string, childId: string, query: AssessmentQueryDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const student = await prisma.student.findUnique({ where: { id: childId } });
    if (!student || student.parentId !== parent.id) throw ApiError.forbidden('Access denied');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { studentId: childId };
    if (query.subjectId) where.subjectId = query.subjectId;

    const [results, total] = await Promise.all([
      prisma.assessmentResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assessedAt: 'desc' },
        include: {
          subject: { select: { name: true } },
          tutor: { select: { firstName: true, lastName: true } },
          documents: { select: { id: true, title: true, fileType: true } },
        },
      }),
      prisma.assessmentResult.count({ where }),
    ]);

    const data = results.map((r) => ({
      id: r.id,
      title: r.title,
      score: r.score,
      maxScore: r.maxScore,
      percentage: r.percentage,
      remarks: r.remarks,
      assessedAt: r.assessedAt,
      subject: r.subject.name,
      tutorName: `${r.tutor.firstName} ${r.tutor.lastName}`,
      documentsCount: r.documents.length,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // PARENT: CHILD PROGRESS (dynamic chart data)
  // ==========================================

  async getChildProgress(userId: string, childId: string, query: ProgressQueryDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const student = await prisma.student.findUnique({ where: { id: childId } });
    if (!student || student.parentId !== parent.id) throw ApiError.forbidden('Access denied');

    const where: Record<string, unknown> = { studentId: childId };
    if (query.subjectId) where.subjectId = query.subjectId;

    const results = await prisma.assessmentResult.findMany({
      where,
      orderBy: { assessedAt: 'asc' },
      include: {
        subject: { select: { id: true, name: true } },
      },
    });

    // Group by subject
    const subjectMap = new Map<string, {
      subjectId: string;
      subjectName: string;
      dataPoints: { date: string; title: string; score: number; maxScore: number; percentage: number }[];
    }>();

    for (const r of results) {
      if (!subjectMap.has(r.subjectId)) {
        subjectMap.set(r.subjectId, {
          subjectId: r.subjectId,
          subjectName: r.subject.name,
          dataPoints: [],
        });
      }
      subjectMap.get(r.subjectId)!.dataPoints.push({
        date: r.assessedAt.toISOString().split('T')[0],
        title: r.title,
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
      });
    }

    // Compute per-subject stats
    const subjects = Array.from(subjectMap.values()).map((s) => {
      const points = s.dataPoints;
      const totalAssessments = points.length;
      const avgPercentage = totalAssessments > 0
        ? Math.round((points.reduce((sum, p) => sum + p.percentage, 0) / totalAssessments) * 10) / 10
        : 0;
      const latestPercentage = totalAssessments > 0 ? points[points.length - 1].percentage : 0;

      // Compute trend: compare avg of last 3 vs previous 3
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (totalAssessments >= 4) {
        const recent = points.slice(-3);
        const previous = points.slice(-6, -3);
        if (previous.length > 0) {
          const recentAvg = recent.reduce((s, p) => s + p.percentage, 0) / recent.length;
          const prevAvg = previous.reduce((s, p) => s + p.percentage, 0) / previous.length;
          const diff = recentAvg - prevAvg;
          if (diff > 5) trend = 'improving';
          else if (diff < -5) trend = 'declining';
        }
      } else if (totalAssessments >= 2) {
        const first = points[0].percentage;
        const last = points[points.length - 1].percentage;
        if (last - first > 5) trend = 'improving';
        else if (last - first < -5) trend = 'declining';
      }

      return {
        ...s,
        totalAssessments,
        averagePercentage: avgPercentage,
        latestPercentage,
        trend,
      };
    });

    const overallAverage = results.length > 0
      ? Math.round((results.reduce((s, r) => s + r.percentage, 0) / results.length) * 10) / 10
      : 0;

    return {
      subjects,
      overallAverage,
      totalAssessments: results.length,
    };
  }

  // ==========================================
  // ADMIN: LIST ALL
  // ==========================================

  async listAll(query: AssessmentQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.subjectId) where.subjectId = query.subjectId;

    const [results, total] = await Promise.all([
      prisma.assessmentResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true } },
          subject: { select: { name: true } },
          tutor: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.assessmentResult.count({ where }),
    ]);

    const data = results.map((r) => ({
      id: r.id,
      title: r.title,
      score: r.score,
      maxScore: r.maxScore,
      percentage: r.percentage,
      assessedAt: r.assessedAt,
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      tutorName: `${r.tutor.firstName} ${r.tutor.lastName}`,
      subject: r.subject.name,
      createdAt: r.createdAt,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }
}
