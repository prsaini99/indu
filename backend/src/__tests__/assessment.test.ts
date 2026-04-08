import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import {
  request,
  API,
  createAuthenticatedUser,
  createSuperAdmin,
  cleanupUser,
  cleanupEnrollments,
  createTutorWithCourse,
  createStudent,
  addCredits,
  getOrCreateCourse,
} from './helpers';

const userIds: string[] = [];
const createdResultIds: string[] = [];

let courseInfo: { id: string; subjectId: string; gradeId: string };

let tutorToken: string;
let tutorUserId: string;
let tutorProfileId: string;

let otherTutorToken: string;
let otherTutorUserId: string;

let parentToken: string;
let parentUserId: string;
let parentProfileId: string;
let studentId: string;

let otherParentToken: string;
let otherParentUserId: string;
let otherStudentId: string;

let adminToken: string;
let enrollmentId: string;

beforeAll(async () => {
  // Get/create the seed course
  const seed = await getOrCreateCourse();
  courseInfo = { id: seed.course.id, subjectId: seed.subject.id, gradeId: seed.grade.id };

  // Primary tutor — assigned to the course
  const tutor = await createTutorWithCourse(courseInfo.id);
  tutorToken = tutor.token;
  tutorUserId = tutor.user.id;
  tutorProfileId = tutor.tutorProfile.id;
  userIds.push(tutorUserId);

  // Other tutor — for ownership tests
  const otherTutor = await createAuthenticatedUser({
    role: Role.TUTOR,
    firstName: 'Other',
    lastName: 'Tutor',
  });
  otherTutorToken = otherTutor.token;
  otherTutorUserId = otherTutor.user.id;
  userIds.push(otherTutorUserId);

  // Primary parent + student
  const parent = await createAuthenticatedUser({
    role: Role.PARENT,
    firstName: 'Assess',
    lastName: 'Parent',
  });
  parentToken = parent.token;
  parentUserId = parent.user.id;
  userIds.push(parentUserId);
  const pp = await prisma.parentProfile.findUnique({ where: { userId: parent.user.id } });
  parentProfileId = pp!.id;
  const student = await createStudent(parentProfileId, courseInfo.gradeId);
  studentId = student.id;

  // Other parent + student — for ownership/isolation tests
  const otherParent = await createAuthenticatedUser({
    role: Role.PARENT,
    firstName: 'Other',
    lastName: 'Parent',
  });
  otherParentToken = otherParent.token;
  otherParentUserId = otherParent.user.id;
  userIds.push(otherParentUserId);
  const op = await prisma.parentProfile.findUnique({ where: { userId: otherParent.user.id } });
  const otherStudent = await createStudent(op!.id, courseInfo.gradeId);
  otherStudentId = otherStudent.id;

  // Admin
  const admin = await createSuperAdmin();
  adminToken = admin.token;
  userIds.push(admin.user.id);

  // Create an active enrollment so the tutor can upload assessment results for this student
  await addCredits(parentProfileId, 200);
  const enr = await request
    .post(`${API}/enrollments`)
    .set('Authorization', `Bearer ${parentToken}`)
    .send({
      studentId,
      subjectId: courseInfo.subjectId,
      schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
      duration: 60,
    });
  if (enr.status !== 201) {
    throw new Error(`Setup failed: could not create enrollment (${enr.status}): ${JSON.stringify(enr.body)}`);
  }
  enrollmentId = enr.body.data.id;
});

afterAll(async () => {
  // Delete all created assessment results (cascades documents)
  if (createdResultIds.length > 0) {
    await prisma.assessmentResult.deleteMany({ where: { id: { in: createdResultIds } } });
  }
  // Also delete any assessment results linked to our test tutor that may have been created
  // by tests but not tracked (defensive cleanup)
  if (tutorProfileId) {
    await prisma.assessmentResult.deleteMany({ where: { tutorId: tutorProfileId } });
  }
  // Now clean enrollments + users
  if (parentProfileId) await cleanupEnrollments(parentProfileId);
  for (const id of userIds) await cleanupUser(id);
});

describe('M11 Assessment Module', () => {
  // ============================================
  // BLOCK 1: POST /assessment-results — Create
  // ============================================
  describe('POST /assessment-results', () => {
    it('should create an assessment result for tutor with active enrollment', async () => {
      const res = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'Unit 1 Test',
          score: 85,
          maxScore: 100,
          remarks: 'Good progress',
          assessedAt: '2026-04-01',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Unit 1 Test');
      expect(res.body.data.score).toBe(85);
      expect(res.body.data.percentage).toBe(85);
      createdResultIds.push(res.body.data.id);
    });

    it('should reject tutor with no enrollment for the student (403)', async () => {
      const res = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'Unauthorized',
          score: 50,
          maxScore: 100,
          assessedAt: '2026-04-01',
        });

      expect(res.status).toBe(403);
    });

    it('should reject missing required fields (validator)', async () => {
      const res = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          studentId,
          // missing subjectId, title, score, assessedAt
        });

      expect(res.status).toBe(400);
    });

    it('should reject non-tutor role (403)', async () => {
      const res = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'Parent Try',
          score: 50,
          maxScore: 100,
          assessedAt: '2026-04-01',
        });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 2: GET /assessment-results — List + Get by ID
  // ============================================
  describe('GET /assessment-results + /assessment-results/:id', () => {
    let resultId: string;

    beforeAll(async () => {
      // Seed one result
      const res = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'List Test',
          score: 70,
          maxScore: 100,
          assessedAt: '2026-04-01',
        });
      resultId = res.body.data.id;
      createdResultIds.push(resultId);
    });

    it('should list tutor own results', async () => {
      const res = await request
        .get(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should get specific result by ID as the owning tutor', async () => {
      const res = await request
        .get(`${API}/assessment-results/${resultId}`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(resultId);
    });

    it('should reject 404 for non-existent result', async () => {
      const res = await request
        .get(`${API}/assessment-results/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // BLOCK 3: PATCH /assessment-results/:id — Update
  // ============================================
  describe('PATCH /assessment-results/:id', () => {
    let resultId: string;

    beforeAll(async () => {
      const res = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'Update Test',
          score: 60,
          maxScore: 100,
          assessedAt: '2026-04-01',
        });
      resultId = res.body.data.id;
      createdResultIds.push(resultId);
    });

    it('should update score and recalculate percentage', async () => {
      const res = await request
        .patch(`${API}/assessment-results/${resultId}`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ score: 90, maxScore: 100 });

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(90);
      expect(res.body.data.percentage).toBe(90);
    });

    it('should reject update by other tutor (403)', async () => {
      const res = await request
        .patch(`${API}/assessment-results/${resultId}`)
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .send({ score: 1 });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 4: DELETE /assessment-results/:id
  // ============================================
  describe('DELETE /assessment-results/:id', () => {
    it('should delete a result owned by the tutor', async () => {
      const create = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'To Delete',
          score: 50,
          maxScore: 100,
          assessedAt: '2026-04-01',
        });
      const id = create.body.data.id;

      const res = await request
        .delete(`${API}/assessment-results/${id}`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);

      const check = await prisma.assessmentResult.findUnique({ where: { id } });
      expect(check).toBeNull();
    });

    it('should reject delete by other tutor (403)', async () => {
      const create = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'No Delete',
          score: 50,
          maxScore: 100,
          assessedAt: '2026-04-01',
        });
      const id = create.body.data.id;
      createdResultIds.push(id);

      const res = await request
        .delete(`${API}/assessment-results/${id}`)
        .set('Authorization', `Bearer ${otherTutorToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 5: POST /assessment-results/:id/documents — Upload URL
  // (the actual upload pipeline endpoint)
  // ============================================
  describe('POST /assessment-results/:id/documents (upload URL)', () => {
    let resultId: string;

    beforeAll(async () => {
      const res = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'Doc Upload Test',
          score: 75,
          maxScore: 100,
          assessedAt: '2026-04-01',
        });
      resultId = res.body.data.id;
      createdResultIds.push(resultId);
    });

    it('should return uploadUrl + fileKey for valid request', async () => {
      const res = await request
        .post(`${API}/assessment-results/${resultId}/documents`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ title: 'Test PDF', fileType: 'pdf' });

      expect(res.status).toBe(201);
      expect(res.body.data.documentId).toBeDefined();
      expect(res.body.data.fileKey).toMatch(new RegExp(`^assessments/${resultId}/.+\\.pdf$`));
      // uploadUrl may be null if S3 not configured, otherwise should be a real URL
      if (res.body.data.uploadUrl !== null) {
        expect(res.body.data.uploadUrl).toMatch(/^https:\/\//);
      }
    });

    it('should work without fileUrl in body (validator was previously broken — fixed)', async () => {
      // This test specifically verifies the bug fix: the validator no longer
      // requires a fileUrl field that the service ignored anyway.
      const res = await request
        .post(`${API}/assessment-results/${resultId}/documents`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ title: 'No fileUrl', fileType: 'pdf' });

      expect(res.status).toBe(201);
    });

    it('should reject missing title (validator)', async () => {
      const res = await request
        .post(`${API}/assessment-results/${resultId}/documents`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ fileType: 'pdf' });

      expect(res.status).toBe(400);
    });

    it('should reject other tutor uploading to result they do not own (403)', async () => {
      const res = await request
        .post(`${API}/assessment-results/${resultId}/documents`)
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .send({ title: 'Sneaky', fileType: 'pdf' });

      expect(res.status).toBe(403);
    });

    it('should reject non-tutor role (403)', async () => {
      const res = await request
        .post(`${API}/assessment-results/${resultId}/documents`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Parent Try', fileType: 'pdf' });

      expect(res.status).toBe(403);
    });

    it('should 404 on nonexistent assessment result', async () => {
      const res = await request
        .post(`${API}/assessment-results/00000000-0000-0000-0000-000000000000/documents`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ title: 'Ghost', fileType: 'pdf' });

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // BLOCK 6: DELETE /assessment-results/:id/documents/:docId
  // ============================================
  describe('DELETE /assessment-results/:id/documents/:docId', () => {
    let resultId: string;

    beforeAll(async () => {
      const res = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'Doc Delete Test',
          score: 75,
          maxScore: 100,
          assessedAt: '2026-04-01',
        });
      resultId = res.body.data.id;
      createdResultIds.push(resultId);
    });

    it('should delete a document', async () => {
      // Create a doc first
      const upload = await request
        .post(`${API}/assessment-results/${resultId}/documents`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ title: 'To Delete', fileType: 'pdf' });
      const docId = upload.body.data.documentId;

      const res = await request
        .delete(`${API}/assessment-results/${resultId}/documents/${docId}`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      const check = await prisma.assessmentDocument.findUnique({ where: { id: docId } });
      expect(check).toBeNull();
    });

    it('should reject other tutor deleting a doc (403)', async () => {
      const upload = await request
        .post(`${API}/assessment-results/${resultId}/documents`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ title: 'Stay Put', fileType: 'pdf' });
      const docId = upload.body.data.documentId;

      const res = await request
        .delete(`${API}/assessment-results/${resultId}/documents/${docId}`)
        .set('Authorization', `Bearer ${otherTutorToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 7: GET /assessment-results/:id/documents/:docId/download (parent)
  // ============================================
  describe('GET /assessment-results/:id/documents/:docId/download', () => {
    let resultId: string;
    let docId: string;

    beforeAll(async () => {
      const res = await request
        .post(`${API}/assessment-results`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          studentId,
          subjectId: courseInfo.subjectId,
          title: 'Download Test',
          score: 80,
          maxScore: 100,
          assessedAt: '2026-04-01',
        });
      resultId = res.body.data.id;
      createdResultIds.push(resultId);

      const upload = await request
        .post(`${API}/assessment-results/${resultId}/documents`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ title: 'Downloadable', fileType: 'pdf' });
      docId = upload.body.data.documentId;
    });

    it('should return presigned download URL for parent of the student', async () => {
      const res = await request
        .get(`${API}/assessment-results/${resultId}/documents/${docId}/download`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      // downloadUrl may be null if S3 not configured
      if (res.body.data.downloadUrl !== null) {
        expect(res.body.data.downloadUrl).toMatch(/^https:\/\//);
      }
      expect(res.body.data.title).toBe('Downloadable');
    });

    it('should reject other parent (403)', async () => {
      const res = await request
        .get(`${API}/assessment-results/${resultId}/documents/${docId}/download`)
        .set('Authorization', `Bearer ${otherParentToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject tutor accessing parent download endpoint (role)', async () => {
      const res = await request
        .get(`${API}/assessment-results/${resultId}/documents/${docId}/download`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 8: GET /parents/children/:childId/assessment-results
  // ============================================
  describe('GET /parents/children/:childId/assessment-results', () => {
    it('should list child results for the parent', async () => {
      const res = await request
        .get(`${API}/parents/children/${studentId}/assessment-results`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject other parent accessing child results (403)', async () => {
      const res = await request
        .get(`${API}/parents/children/${studentId}/assessment-results`)
        .set('Authorization', `Bearer ${otherParentToken}`);

      expect(res.status).toBe(403);
    });
  });
});
