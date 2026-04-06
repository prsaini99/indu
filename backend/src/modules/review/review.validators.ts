import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const reviewQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const adminReviewQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  tutorId: z.string().uuid().optional(),
  isVisible: z.enum(['true', 'false']).optional(),
});

export const tutorIdParam = z.object({
  id: z.string().uuid(),
});

export const reviewIdParam = z.object({
  id: z.string().uuid(),
});

export const updateVisibilitySchema = z.object({
  isVisible: z.boolean(),
});

export const tutorReviewsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
