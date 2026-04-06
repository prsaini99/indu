import { z } from 'zod';

export const sessionIdParam = z.object({
  sessionId: z.string().uuid(),
});

export const demoBookingIdParam = z.object({
  demoBookingId: z.string().uuid(),
});

export const recordingIdParam = z.object({
  id: z.string().uuid(),
});

export const recordingQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'AVAILABLE', 'FAILED']).optional(),
});
