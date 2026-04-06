import { z } from 'zod';

export const parentIdParam = z.object({
  parentId: z.string().uuid(),
});

export const creditPackageIdParam = z.object({
  id: z.string().uuid(),
});

export const createCreditPackageSchema = z.object({
  name: z.string().min(1).max(100),
  credits: z.number().int().min(1),
  priceInFils: z.number().int().min(1),
  sortOrder: z.number().int().optional(),
});

export const updateCreditPackageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  credits: z.number().int().min(1).optional(),
  priceInFils: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const adjustCreditsSchema = z.object({
  amount: z.number().int().refine((v) => v !== 0, { message: 'Amount must not be zero' }),
  description: z.string().min(1).max(500),
});

export const walletTransactionQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(['PURCHASE', 'DEDUCTION', 'ADMIN_ADJUSTMENT']).optional(),
});
