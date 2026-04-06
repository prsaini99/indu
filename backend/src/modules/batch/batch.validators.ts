import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const scheduleSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'Time must be HH:mm format'),
});

export const createBatchSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  subjectId: z.string().uuid(),
  tutorId: z.string().uuid(),
  gradeId: z.string().uuid(),
  schedule: z.array(scheduleSlotSchema).min(1).max(7)
    .refine((slots) => {
      const days = slots.map((s) => s.dayOfWeek);
      return new Set(days).size === days.length;
    }, 'Each day can only appear once'),
  duration: z.number().int().refine((v) => [60, 90, 120].includes(v), 'Duration must be 60, 90, or 120 minutes'),
  minStudents: z.number().int().min(1).max(10).optional(),
  maxStudents: z.number().int().min(1).max(10).optional(),
  creditsPerSession: z.number().int().min(1),
  startDate: z.string().optional(),
});

export const updateBatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tutorId: z.string().uuid().optional(),
  schedule: z.array(scheduleSlotSchema).min(1).max(7).optional(),
  duration: z.number().int().refine((v) => [60, 90, 120].includes(v)).optional(),
  minStudents: z.number().int().min(1).max(10).optional(),
  maxStudents: z.number().int().min(1).max(10).optional(),
  creditsPerSession: z.number().int().min(1).optional(),
  startDate: z.string().optional(),
});

export const joinBatchSchema = z.object({
  studentId: z.string().uuid(),
});

export const batchIdParam = z.object({
  id: z.string().uuid(),
});

export const studentIdParam = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
});

export const batchQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['OPEN', 'FULL', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  subjectId: z.string().optional(),
  gradeId: z.string().optional(),
});

export const cancelReasonSchema = z.object({
  reason: z.string().optional(),
});
