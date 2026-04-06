import { z } from 'zod';

export const createAssessmentResultSchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  enrollmentId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  score: z.number().min(0),
  maxScore: z.number().min(1).default(100),
  remarks: z.string().max(2000).optional(),
  assessedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateAssessmentResultSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  score: z.number().min(0).optional(),
  maxScore: z.number().min(1).optional(),
  remarks: z.string().max(2000).optional(),
  assessedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const assessmentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  studentId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
});

export const assessmentIdParam = z.object({
  id: z.string().uuid(),
});

export const documentIdParam = z.object({
  id: z.string().uuid(),
  docId: z.string().uuid(),
});

export const childIdParam = z.object({
  childId: z.string().uuid(),
});

export const childAssessmentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  subjectId: z.string().uuid().optional(),
});

export const progressQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
});

export const uploadDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  fileType: z.string().min(1).max(20),
  fileUrl: z.string().url(),
  fileSizeKb: z.number().int().min(1).max(51200).optional(), // Max 50 MB
});
