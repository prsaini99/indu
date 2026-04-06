import { z } from 'zod';

export const createCheckoutSchema = z.object({
  packageId: z.string().uuid(),
});

export const paymentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'EXPIRED']).optional(),
});
