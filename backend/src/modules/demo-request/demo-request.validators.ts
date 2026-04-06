import { z } from 'zod';

export const createDemoRequestSchema = z.object({
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(1, 'Phone number is required'),
  childFirstName: z.string().min(1, 'Child first name is required'),
  childLastName: z.string().min(1, 'Child last name is required'),
  childDateOfBirth: z.string().optional(),
  boardId: z.string().uuid('Invalid board ID'),
  gradeId: z.string().uuid('Invalid grade ID'),
  subjectIds: z.array(z.string().uuid('Invalid subject ID')).min(1, 'At least one subject is required'),
  preferredTimeSlot: z.enum(['MORNING', 'AFTERNOON', 'EVENING']),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  alternativeDate: z.string().optional(),
  notes: z.string().optional(),
});

export const publicCreateDemoRequestSchema = createDemoRequestSchema.extend({
  parentName: z.string().min(1, 'Parent name is required'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
});

export const demoRequestIdParam = z.object({
  id: z.string().uuid('Invalid demo request ID'),
});

export const demoRequestQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'ASSIGNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
});
