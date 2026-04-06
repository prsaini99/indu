import { z } from 'zod';

export const courseIdParam = z.object({
  id: z.string().uuid(),
});

export const materialIdParam = z.object({
  id: z.string().uuid(),
  materialId: z.string().uuid(),
});

export const gradeTierIdParam = z.object({
  id: z.string().uuid(),
});

export const courseTutorParams = z.object({
  id: z.string().uuid(),
  tutorId: z.string().uuid(),
});

export const createCourseSchema = z.object({
  subjectId: z.string().uuid(),
  gradeId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const updateCourseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const courseSearchQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  subject: z.string().uuid().optional(),
  grade: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const createCourseMaterialSchema = z.object({
  title: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  fileType: z.string().min(1).max(20),
  fileSizeKb: z.number().int().positive().optional(),
});

export const updateGradeTierSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  creditsPerClass: z.number().int().min(1).optional(),
  credits60Min: z.number().int().min(1).optional(),
  credits90Min: z.number().int().min(1).optional(),
  credits120Min: z.number().int().min(1).optional(),
});

export const assignTutorToCourseSchema = z.object({
  tutorId: z.string().uuid(),
  tutorRate: z.number().int().min(0, 'Rate must be non-negative'),
});
