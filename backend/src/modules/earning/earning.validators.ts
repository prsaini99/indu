import { z } from 'zod';

export const earningQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['UNPAID', 'PAID']).optional(),
});

export const adminEarningQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['UNPAID', 'PAID']).optional(),
  tutorId: z.string().uuid().optional(),
});

export const createPayoutSchema = z.object({
  tutorId: z.string().uuid(),
  earningIds: z.array(z.string().uuid()).min(1, 'At least one earning ID is required'),
  paidVia: z.string().max(100).optional(),
  referenceNo: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export const payoutQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  tutorId: z.string().uuid().optional(),
});
