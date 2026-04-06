import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createDemoBookingSchema = z.object({
  demoRequestId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  tutorId: z.string().uuid('Invalid tutor ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledStart: z.string().regex(timeRegex, 'Start time must be HH:mm format'),
  scheduledEnd: z.string().regex(timeRegex, 'End time must be HH:mm format'),
  meetingLink: z.union([z.string().url('Invalid meeting URL'), z.literal('')]).optional().transform((v) => v === '' ? undefined : v),
  meetingPassword: z.string().optional(),
  parentNotes: z.string().optional(),
  consultantNotes: z.string().optional(),
});

export const updateDemoBookingSchema = z.object({
  scheduledDate: z.string().optional(),
  scheduledStart: z.string().regex(timeRegex, 'Start time must be HH:mm format').optional(),
  scheduledEnd: z.string().regex(timeRegex, 'End time must be HH:mm format').optional(),
  meetingLink: z.string().url('Invalid meeting URL').optional().nullable(),
  meetingPassword: z.string().optional().nullable(),
  consultantNotes: z.string().optional(),
});

export const updateDemoBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});

export const demoBookingIdParam = z.object({
  id: z.string().uuid('Invalid demo booking ID'),
});

export const demoBookingQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
});
