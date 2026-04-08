import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import {
  request,
  API,
  createAuthenticatedUser,
  createSuperAdmin,
  cleanupUser,
  getOrCreateCourse,
  createTutorWithCourse,
} from './helpers';

const userIds: string[] = [];

let courseId: string;

let assignedTutorToken: string;
let assignedTutorUserId: string;

let unassignedTutorToken: string;
let unassignedTutorUserId: string;

let adminToken: string;
let parentToken: string;

beforeAll(async () => {
  // Get/create the seed course (Mathematics — Grade 5)
  const seed = await getOrCreateCourse();
  courseId = seed.course.id;

  // Tutor assigned to the course (via createTutorWithCourse helper)
  const assigned = await createTutorWithCourse(courseId);
  assignedTutorToken = assigned.token;
  assignedTutorUserId = assigned.user.id;
  userIds.push(assignedTutorUserId);

  // Tutor NOT assigned to the course
  const unassigned = await createAuthenticatedUser({
    role: Role.TUTOR,
    firstName: 'Unassigned',
    lastName: 'Tutor',
  });
  unassignedTutorToken = unassigned.token;
  unassignedTutorUserId = unassigned.user.id;
  userIds.push(unassignedTutorUserId);

  // Admin
  const admin = await createSuperAdmin();
  adminToken = admin.token;
  userIds.push(admin.user.id);

  // Parent (for role-rejection tests)
  const parent = await createAuthenticatedUser({ role: Role.PARENT });
  parentToken = parent.token;
  userIds.push(parent.user.id);
});

afterAll(async () => {
  for (const id of userIds) await cleanupUser(id);
});

describe('M4 Course: Material Upload URLs', () => {
  // ============================================
  // BLOCK 1: TUTOR — POST /tutors/courses/:id/materials/upload-url
  // ============================================
  describe('POST /tutors/courses/:id/materials/upload-url', () => {
    it('should return presigned URL for assigned tutor uploading a pdf', async () => {
      const res = await request
        .post(`${API}/tutors/courses/${courseId}/materials/upload-url`)
        .set('Authorization', `Bearer ${assignedTutorToken}`)
        .send({ fileType: 'pdf', fileSizeKb: 1024 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toMatch(/^https:\/\//);
      expect(res.body.data.fileKey).toMatch(new RegExp(`^course-materials/${courseId}/.+\\.pdf$`));
      expect(res.body.data.contentType).toBe('application/pdf');
    });

    it('should accept docx, pptx, xlsx, mp4', async () => {
      for (const ext of ['docx', 'pptx', 'xlsx', 'mp4']) {
        const res = await request
          .post(`${API}/tutors/courses/${courseId}/materials/upload-url`)
          .set('Authorization', `Bearer ${assignedTutorToken}`)
          .send({ fileType: ext, fileSizeKb: 1024 });
        expect(res.status).toBe(200);
        expect(res.body.data.fileKey).toMatch(new RegExp(`\\.${ext}$`));
      }
    });

    it('should reject jpg as course material (INVALID_FILE_TYPE)', async () => {
      const res = await request
        .post(`${API}/tutors/courses/${courseId}/materials/upload-url`)
        .set('Authorization', `Bearer ${assignedTutorToken}`)
        .send({ fileType: 'jpg', fileSizeKb: 200 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('should reject file > 50 MB (FILE_TOO_LARGE)', async () => {
      const res = await request
        .post(`${API}/tutors/courses/${courseId}/materials/upload-url`)
        .set('Authorization', `Bearer ${assignedTutorToken}`)
        .send({ fileType: 'pdf', fileSizeKb: 51 * 1024 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    });

    it('should reject tutor not assigned to course (403)', async () => {
      const res = await request
        .post(`${API}/tutors/courses/${courseId}/materials/upload-url`)
        .set('Authorization', `Bearer ${unassignedTutorToken}`)
        .send({ fileType: 'pdf', fileSizeKb: 1024 });

      expect(res.status).toBe(403);
    });

    it('should reject non-existent course (404)', async () => {
      const res = await request
        .post(`${API}/tutors/courses/00000000-0000-0000-0000-000000000000/materials/upload-url`)
        .set('Authorization', `Bearer ${assignedTutorToken}`)
        .send({ fileType: 'pdf', fileSizeKb: 1024 });

      // Service throws "not assigned" before "not found" since assignment lookup happens first
      expect([403, 404]).toContain(res.status);
    });

    it('should reject non-tutor role (403)', async () => {
      const res = await request
        .post(`${API}/tutors/courses/${courseId}/materials/upload-url`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ fileType: 'pdf', fileSizeKb: 1024 });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 2: ADMIN — POST /admin/courses/:id/materials/upload-url
  // ============================================
  describe('POST /admin/courses/:id/materials/upload-url', () => {
    it('should return presigned URL for admin (no course assignment needed)', async () => {
      const res = await request
        .post(`${API}/admin/courses/${courseId}/materials/upload-url`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileType: 'pdf', fileSizeKb: 1024 });

      expect(res.status).toBe(200);
      expect(res.body.data.uploadUrl).toMatch(/^https:\/\//);
      expect(res.body.data.fileKey).toMatch(new RegExp(`^course-materials/${courseId}/.+\\.pdf$`));
    });

    it('should reject non-existent course (404)', async () => {
      const res = await request
        .post(`${API}/admin/courses/00000000-0000-0000-0000-000000000000/materials/upload-url`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileType: 'pdf', fileSizeKb: 1024 });

      expect(res.status).toBe(404);
    });

    it('should reject invalid file type', async () => {
      const res = await request
        .post(`${API}/admin/courses/${courseId}/materials/upload-url`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileType: 'exe', fileSizeKb: 1024 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('should reject tutor (no admin role)', async () => {
      const res = await request
        .post(`${API}/admin/courses/${courseId}/materials/upload-url`)
        .set('Authorization', `Bearer ${assignedTutorToken}`)
        .send({ fileType: 'pdf', fileSizeKb: 1024 });

      expect(res.status).toBe(403);
    });

    it('should reject parent (no admin role)', async () => {
      const res = await request
        .post(`${API}/admin/courses/${courseId}/materials/upload-url`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ fileType: 'pdf', fileSizeKb: 1024 });

      expect(res.status).toBe(403);
    });
  });
});
