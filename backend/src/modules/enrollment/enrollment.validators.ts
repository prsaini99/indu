import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const scheduleSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'Time must be HH:mm format'),
});

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  schedule: z.array(scheduleSlotSchema).min(1, 'At least one schedule slot required').max(7)
    .refine((slots) => {
      const days = slots.map((s) => s.dayOfWeek);
      return new Set(days).size === days.length;
    }, 'Each day of the week can only appear once in the schedule'),
  duration: z.number().int().refine((v) => [60, 90, 120].includes(v), 'Duration must be 60, 90, or 120 minutes'),
  zoomLink: z.string().url('Invalid Zoom URL').optional(),
  zoomPassword: z.string().optional(),
});

export const enrollmentIdParam = z.object({
  id: z.string().uuid('Invalid enrollment ID'),
});

export const sessionIdParam = z.object({
  id: z.string().uuid('Invalid session ID'),
});

export const enrollmentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
});

export const sessionQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED_PARENT', 'CANCELLED_LATE', 'SKIPPED']).optional(),
});

export const cancelSessionSchema = z.object({
  reason: z.string().optional(),
});

export const reassignTutorSchema = z.object({
  tutorId: z.string().uuid('Invalid tutor ID'),
});

export const updateMeetingLinkSchema = z.object({
  zoomLink: z.string().url('Invalid Zoom URL'),
  zoomPassword: z.string().optional(),
});

export const reviewNoShowSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
});

export const availableSlotsQuerySchema = z.object({
  subjectId: z.string().uuid('Invalid subject ID'),
  gradeId: z.string().uuid('Invalid grade ID'),
  duration: z.string().regex(/^\d+$/, 'Duration must be a number'),
});
