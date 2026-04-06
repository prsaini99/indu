import { z } from 'zod';

export const updateParentProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const createChildSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  gradeId: z.string().uuid('Invalid grade ID'),
  subjectIds: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
});

export const updateChildSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  dateOfBirth: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  gradeId: z.string().uuid().optional(),
  subjectIds: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['TUTOR', 'CONSULTANT', 'ADMIN']),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  permissions: z
    .array(
      z.enum([
        'USER_MANAGEMENT',
        'TUTOR_MANAGEMENT',
        'COURSE_MANAGEMENT',
        'BOOKING_OVERSIGHT',
        'PAYMENT_MANAGEMENT',
        'CREDIT_MANAGEMENT',
        'TUTOR_PAYOUTS',
        'CMS_MANAGEMENT',
        'ANALYTICS_ACCESS',
        'SYSTEM_CONFIG',
      ])
    )
    .optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const setPermissionsSchema = z.object({
  permissions: z.array(
    z.enum([
      'USER_MANAGEMENT',
      'TUTOR_MANAGEMENT',
      'COURSE_MANAGEMENT',
      'BOOKING_OVERSIGHT',
      'PAYMENT_MANAGEMENT',
      'CREDIT_MANAGEMENT',
      'TUTOR_PAYOUTS',
      'CMS_MANAGEMENT',
      'ANALYTICS_ACCESS',
      'SYSTEM_CONFIG',
    ])
  ),
});

export const updateConsultantProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const userIdParam = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export const childIdParam = z.object({
  childId: z.string().uuid('Invalid child ID'),
});

export const parentChildParams = z.object({
  parentId: z.string().uuid('Invalid parent ID'),
  childId: z.string().uuid('Invalid child ID'),
});

export const parentIdParam = z.object({
  parentId: z.string().uuid('Invalid parent ID'),
});

export const usersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.enum(['PARENT', 'TUTOR', 'CONSULTANT', 'ADMIN', 'SUPER_ADMIN']).optional(),
  search: z.string().optional(),
  isActive: z.string().optional(),
});
