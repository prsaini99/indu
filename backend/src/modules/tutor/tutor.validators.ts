import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// ==========================================
// PARAM VALIDATORS
// ==========================================

export const tutorIdParam = z.object({
  id: z.string().uuid('Invalid tutor ID'),
});

export const certIdParam = z.object({
  id: z.string().uuid('Invalid certification ID'),
});

export const templateIdParam = z.object({
  id: z.string().uuid('Invalid template ID'),
});

export const blockedDateIdParam = z.object({
  id: z.string().uuid('Invalid blocked date ID'),
});

export const tutorCourseParams = z.object({
  id: z.string().uuid('Invalid tutor ID'),
  courseId: z.string().uuid('Invalid course ID'),
});

// ==========================================
// M3: TUTOR PROFILE
// ==========================================

export const updateTutorProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  phone: z.string().optional(),
  profilePhotoUrl: z.string().url().optional(),
  introVideoUrl: z.string().url().optional().nullable(),
  experience: z.number().int().min(0).optional(),
});

export const createCertificationSchema = z.object({
  title: z.string().min(2).max(200),
  institution: z.string().max(200).optional(),
  year: z.number().int().min(1950).max(2030).optional(),
  documentUrl: z.string().url('Must be a valid URL'),
});

// ==========================================
// M3: ADMIN TUTOR MANAGEMENT
// ==========================================

export const adminUpdateTutorSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  bio: z.string().max(2000).optional(),
  experience: z.number().int().min(0).optional(),
  profilePhotoUrl: z.string().url().optional(),
});

export const adminAssignCourseSchema = z.object({
  courseId: z.string().uuid(),
  tutorRate: z.number().int().min(0, 'Rate must be non-negative'),
});

export const adminToggleStatusSchema = z.object({
  isActive: z.boolean(),
});

// ==========================================
// M5: AVAILABILITY
// ==========================================

export const createTemplateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'Must be HH:mm format'),
  endTime: z.string().regex(timeRegex, 'Must be HH:mm format'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'startTime must be before endTime',
  path: ['endTime'],
});

export const createBlockedDateSchema = z.object({
  date: z.string().regex(dateRegex, 'Must be YYYY-MM-DD format'),
  reason: z.string().max(500).optional(),
});

export const availabilityQuerySchema = z.object({
  startDate: z.string().regex(dateRegex, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(dateRegex, 'Must be YYYY-MM-DD'),
}).refine((data) => data.startDate <= data.endDate, {
  message: 'startDate must be before or equal to endDate',
  path: ['endDate'],
});

// ==========================================
// M3: TUTOR SEARCH
// ==========================================

export const tutorSearchQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  subject: z.string().uuid().optional(),
  grade: z.string().uuid().optional(),
  search: z.string().optional(),
  sort: z.enum(['experience', 'rate', 'name']).optional(),
});
