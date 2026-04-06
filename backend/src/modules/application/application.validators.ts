import { z } from 'zod';

export const createApplicationSchema = z.object({
  role: z.enum(['TUTOR', 'CONSULTANT']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  experience: z.number().int().min(0).optional(),
  bio: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  subjects: z.string().optional(),
  qualifications: z.string().optional(),
});

export const reviewApplicationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
});

export const applicationIdParam = z.object({
  id: z.string().uuid('Invalid application ID'),
});

export const applicationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  role: z.enum(['TUTOR', 'CONSULTANT']).optional(),
});
