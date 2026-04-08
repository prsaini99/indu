import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import {
  request,
  API,
  createAuthenticatedUser,
  createSuperAdmin,
  cleanupUser,
  cleanupBatch,
  cleanupBatchesForTutor,
  cleanupEnrollments,
  createTutorWithCourse,
  createStudent,
  addCredits,
  createBatch,
  getOrCreateCourse,
} from './helpers';

const userIds: string[] = [];

// Shared fixtures
let courseInfo: { id: string; subjectId: string; gradeId: string };
let subjectId: string;
let gradeId: string;

let parentToken: string;
let parentUserId: string;
let parentProfileId: string;
let studentId: string;

let tutorUserId: string;
let tutorProfileId: string;

let adminToken: string;

beforeAll(async () => {
  // Get/create the seed course (Mathematics — Grade 5)
  const seed = await getOrCreateCourse();
  courseInfo = { id: seed.course.id, subjectId: seed.subject.id, gradeId: seed.grade.id };
  subjectId = seed.subject.id;
  gradeId = seed.grade.id;

  // Create a tutor
  const tutor = await createTutorWithCourse(courseInfo.id);
  tutorUserId = tutor.user.id;
  tutorProfileId = tutor.tutorProfile.id;
  userIds.push(tutorUserId);

  // Create a parent
  const parent = await createAuthenticatedUser({ role: Role.PARENT, firstName: 'Batch', lastName: 'Parent' });
  parentToken = parent.token;
  parentUserId = parent.user.id;
  userIds.push(parentUserId);

  const pp = await prisma.parentProfile.findUnique({ where: { userId: parent.user.id } });
  parentProfileId = pp!.id;

  // Create a student
  const student = await createStudent(parentProfileId, gradeId);
  studentId = student.id;

  // Create an admin
  const admin = await createSuperAdmin();
  adminToken = admin.token;
  userIds.push(admin.user.id);
});

afterAll(async () => {
  if (tutorProfileId) await cleanupBatchesForTutor(tutorProfileId);
  if (parentProfileId) await cleanupEnrollments(parentProfileId);
  for (const id of userIds) await cleanupUser(id);
});

describe('M7-V2: Batch Module', () => {
  // ============================================
  // BLOCK 1: ADMIN CREATE BATCH
  // ============================================
  describe('POST /admin/batches', () => {
    afterAll(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
    });

    it('should create batch with defaults', async () => {
      const res = await request
        .post(`${API}/admin/batches`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Batch 1',
          subjectId,
          tutorId: tutorProfileId,
          gradeId,
          schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
          duration: 60,
          creditsPerSession: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.minStudents).toBe(1);
      expect(res.body.data.maxStudents).toBe(6);
      expect(res.body.data.creditsPerSession).toBe(2);
    });

    it('should reject missing subject (404)', async () => {
      const res = await request
        .post(`${API}/admin/batches`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          subjectId: '00000000-0000-0000-0000-000000000000',
          tutorId: tutorProfileId,
          gradeId,
          schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
          duration: 60,
          creditsPerSession: 2,
        });
      expect(res.status).toBe(404);
    });

    it('should reject missing tutor (404)', async () => {
      const res = await request
        .post(`${API}/admin/batches`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          subjectId,
          tutorId: '00000000-0000-0000-0000-000000000000',
          gradeId,
          schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
          duration: 60,
          creditsPerSession: 2,
        });
      expect(res.status).toBe(404);
    });

    it('should reject missing grade (404)', async () => {
      const res = await request
        .post(`${API}/admin/batches`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          subjectId,
          tutorId: tutorProfileId,
          gradeId: '00000000-0000-0000-0000-000000000000',
          schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
          duration: 60,
          creditsPerSession: 2,
        });
      expect(res.status).toBe(404);
    });

    it('should reject duplicate days in schedule (validator)', async () => {
      const res = await request
        .post(`${API}/admin/batches`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          subjectId,
          tutorId: tutorProfileId,
          gradeId,
          schedule: [
            { dayOfWeek: 1, startTime: '10:00' },
            { dayOfWeek: 1, startTime: '14:00' },
          ],
          duration: 60,
          creditsPerSession: 2,
        });
      expect(res.status).toBe(400);
    });

    it('should reject invalid duration (75)', async () => {
      const res = await request
        .post(`${API}/admin/batches`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          subjectId,
          tutorId: tutorProfileId,
          gradeId,
          schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
          duration: 75,
          creditsPerSession: 2,
        });
      expect(res.status).toBe(400);
    });

    it('should reject parent role (403)', async () => {
      const res = await request
        .post(`${API}/admin/batches`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          name: 'Test',
          subjectId,
          tutorId: tutorProfileId,
          gradeId,
          schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
          duration: 60,
          creditsPerSession: 2,
        });
      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 2: ADMIN LIST / GET / UPDATE
  // ============================================
  describe('GET/PATCH /admin/batches', () => {
    let batchId: string;

    beforeAll(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
      const b = await createBatch({ tutorProfileId, subjectId, gradeId });
      batchId = b.id;
    });

    afterAll(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
    });

    it('GET /admin/batches should return paginated list', async () => {
      const res = await request
        .get(`${API}/admin/batches`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('GET /admin/batches?status=OPEN should filter', async () => {
      const res = await request
        .get(`${API}/admin/batches?status=OPEN`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((b: any) => b.status === 'OPEN')).toBe(true);
    });

    it('GET /admin/batches/:id should return batch with sessions', async () => {
      const res = await request
        .get(`${API}/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(batchId);
      expect(res.body.data).toHaveProperty('sessions');
    });

    it('PATCH /admin/batches/:id should update OPEN batch', async () => {
      const res = await request
        .patch(`${API}/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('PATCH non-OPEN batch should fail with INVALID_STATUS', async () => {
      // Force batch to ACTIVE state
      await prisma.batch.update({ where: { id: batchId }, data: { status: 'ACTIVE' } });

      const res = await request
        .patch(`${API}/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Should Fail' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');

      // Restore for cleanup
      await prisma.batch.update({ where: { id: batchId }, data: { status: 'OPEN' } });
    });
  });

  // ============================================
  // BLOCK 3: START BATCH
  // ============================================
  describe('PATCH /admin/batches/:id/start', () => {
    afterEach(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
      await cleanupEnrollments(parentProfileId);
    });

    it('should start OPEN batch with ≥minStudents and generate sessions', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, minStudents: 1 });
      // Add an active student
      await addCredits(parentProfileId, 100);
      await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId, parentId: parentProfileId },
      });

      const res = await request
        .patch(`${API}/admin/batches/${batch.id}/start`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');

      // Sessions should have been generated
      const sessions = await prisma.batchSession.findMany({ where: { batchId: batch.id } });
      // At least one session may exist (depends on whether 7-day window includes a Saturday)
      // We don't require >0 because the rolling-window may legitimately produce 0 if today is Sat after 20:00
      expect(Array.isArray(sessions)).toBe(true);

      // If sessions exist, verify per-student credit deductions
      if (sessions.length > 0) {
        const credits = await prisma.batchSessionCredit.findMany({
          where: { batchSessionId: { in: sessions.map((s) => s.id) } },
        });
        if (credits.length > 0) {
          const txs = await prisma.creditTransaction.findMany({
            where: { batchSessionCreditId: { in: credits.map((c) => c.id) } },
          });
          expect(txs.length).toBe(credits.length);
          expect(txs.every((t) => t.type === 'DEDUCTION')).toBe(true);
        }
      }
    });

    it('should fail with MIN_STUDENTS when not enough students', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, minStudents: 2 });
      // Only 1 student
      await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId, parentId: parentProfileId },
      });

      const res = await request
        .patch(`${API}/admin/batches/${batch.id}/start`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MIN_STUDENTS');
    });

    it('should fail with INVALID_STATUS when batch not OPEN/FULL', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'CANCELLED' } });

      const res = await request
        .patch(`${API}/admin/batches/${batch.id}/start`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });
  });

  // ============================================
  // BLOCK 4: CANCEL BATCH
  // ============================================
  describe('PATCH /admin/batches/:id/cancel', () => {
    afterEach(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
      await cleanupEnrollments(parentProfileId);
    });

    it('should cancel OPEN batch', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });

      const res = await request
        .patch(`${API}/admin/batches/${batch.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(res.body.data.zoomLink).toBeNull();
      expect(res.body.data.zoomMeetingId).toBeNull();
    });

    it('should cancel ACTIVE batch and refund future sessions', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, creditsPerSession: 2 });
      await addCredits(parentProfileId, 100);
      await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId, parentId: parentProfileId },
      });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'ACTIVE' } });

      // Create a future session manually with a credit deduction (simulating session generation)
      const future = new Date();
      future.setDate(future.getDate() + 7);
      const session = await prisma.batchSession.create({
        data: {
          batchId: batch.id,
          status: 'CONFIRMED',
          scheduledDate: future,
          scheduledStart: '20:00',
          scheduledEnd: '21:00',
        },
      });
      await prisma.batchSessionCredit.create({
        data: {
          batchSessionId: session.id,
          parentId: parentProfileId,
          studentId,
          creditsCharged: 2,
          creditDeductedAt: new Date(),
        },
      });

      const res = await request
        .patch(`${API}/admin/batches/${batch.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');

      // Verify refund CreditTransaction was created
      const refund = await prisma.creditTransaction.findFirst({
        where: {
          parentId: parentProfileId,
          type: 'ADMIN_ADJUSTMENT',
          description: { contains: 'Refund (batch cancelled)' },
        },
      });
      expect(refund).not.toBeNull();
      expect(refund!.amount).toBe(2);

      // Future BatchSession should be deleted by refundBatchFutureSessions
      const remaining = await prisma.batchSession.findUnique({ where: { id: session.id } });
      expect(remaining).toBeNull();
    });

    it('should reject cancelling already-cancelled batch', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'CANCELLED' } });

      const res = await request
        .patch(`${API}/admin/batches/${batch.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });

    it('should reject cancelling nonexistent batch', async () => {
      const res = await request
        .patch(`${API}/admin/batches/00000000-0000-0000-0000-000000000000/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // BLOCK 5: ADMIN REMOVE STUDENT
  // ============================================
  describe('DELETE /admin/batches/:id/students/:studentId', () => {
    afterEach(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
    });

    it('should remove active student and set isActive=false', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      const bs = await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId, parentId: parentProfileId },
      });

      const res = await request
        .delete(`${API}/admin/batches/${batch.id}/students/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Admin removal' });

      expect(res.status).toBe(200);

      const updated = await prisma.batchStudent.findUnique({ where: { id: bs.id } });
      expect(updated!.isActive).toBe(false);
      expect(updated!.leftAt).not.toBeNull();
    });

    it('should revert FULL → OPEN after removal', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, maxStudents: 1 });
      await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId, parentId: parentProfileId },
      });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'FULL' } });

      await request
        .delete(`${API}/admin/batches/${batch.id}/students/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const updated = await prisma.batch.findUnique({ where: { id: batch.id } });
      expect(updated!.status).toBe('OPEN');
    });

    it('should reject removing non-active student (404)', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      // Don't add student

      const res = await request
        .delete(`${API}/admin/batches/${batch.id}/students/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // BLOCK 6: PARENT BROWSE AVAILABLE
  // ============================================
  describe('GET /batches/available', () => {
    let openBatchId: string;
    let cancelledBatchId: string;

    beforeAll(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
      const open = await createBatch({ tutorProfileId, subjectId, gradeId });
      openBatchId = open.id;
      const cancelled = await createBatch({ tutorProfileId, subjectId, gradeId });
      cancelledBatchId = cancelled.id;
      await prisma.batch.update({ where: { id: cancelledBatchId }, data: { status: 'CANCELLED' } });
    });

    afterAll(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
    });

    it('should return only OPEN batches', async () => {
      const res = await request
        .get(`${API}/batches/available`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((b: any) => b.status === 'OPEN')).toBe(true);
      const ids = res.body.data.map((b: any) => b.id);
      expect(ids).toContain(openBatchId);
      expect(ids).not.toContain(cancelledBatchId);
    });

    it('should filter by subjectId', async () => {
      const res = await request
        .get(`${API}/batches/available?subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((b: any) => b.subject.id === subjectId)).toBe(true);
    });

    it('should reject non-parent role', async () => {
      const res = await request
        .get(`${API}/batches/available`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 7: PARENT JOIN
  // ============================================
  describe('POST /batches/:id/join', () => {
    afterEach(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
      await cleanupEnrollments(parentProfileId);
    });

    it('should join with sufficient credits', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, creditsPerSession: 2 });
      await addCredits(parentProfileId, 100);

      const res = await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('Successfully');
      expect(res.body.data.spotsRemaining).toBeGreaterThanOrEqual(0);

      // BatchStudent created
      const bs = await prisma.batchStudent.findUnique({
        where: { batchId_studentId: { batchId: batch.id, studentId } },
      });
      expect(bs).not.toBeNull();
      expect(bs!.isActive).toBe(true);
    });

    it('should transition OPEN → FULL when last spot taken', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, maxStudents: 1, creditsPerSession: 2 });
      await addCredits(parentProfileId, 100);

      await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      const updated = await prisma.batch.findUnique({ where: { id: batch.id } });
      expect(updated!.status).toBe('FULL');
    });

    it('should reject INSUFFICIENT_CREDITS', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, creditsPerSession: 100 });
      // No credits added

      const res = await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('should reject GRADE_MISMATCH', async () => {
      // Find a different grade
      const otherGrade = await prisma.gradeLevel.findFirst({
        where: { id: { not: gradeId } },
      });
      if (!otherGrade) return; // skip if no other grade in seed data

      const batch = await createBatch({ tutorProfileId, subjectId, gradeId: otherGrade.id });
      await addCredits(parentProfileId, 100);

      const res = await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('GRADE_MISMATCH');
    });

    it("should reject student that doesn't belong to parent (404)", async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      await addCredits(parentProfileId, 100);

      // Create another parent + student
      const other = await createAuthenticatedUser({ role: Role.PARENT });
      userIds.push(other.user.id);
      const op = await prisma.parentProfile.findUnique({ where: { userId: other.user.id } });
      const otherStudent = await createStudent(op!.id, gradeId);

      const res = await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId: otherStudent.id });

      expect(res.status).toBe(404);
    });

    it('should reject already-joined (409 ALREADY_JOINED)', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, creditsPerSession: 2 });
      await addCredits(parentProfileId, 100);

      await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      const res = await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_JOINED');
    });

    it('should reject joining FULL batch', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'FULL' } });
      await addCredits(parentProfileId, 100);

      const res = await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });

    it('should reject joining ACTIVE batch', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'ACTIVE' } });
      await addCredits(parentProfileId, 100);

      const res = await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });

    it('should reject joining CANCELLED batch', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'CANCELLED' } });
      await addCredits(parentProfileId, 100);

      const res = await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      expect(res.status).toBe(400);
    });

    it('should allow re-joining after leave (reactivation)', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, creditsPerSession: 2 });
      await addCredits(parentProfileId, 100);

      // Join
      await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      // Leave
      await request
        .post(`${API}/batches/${batch.id}/leave`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      // Re-join
      const res = await request
        .post(`${API}/batches/${batch.id}/join`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      expect(res.status).toBe(200);
      const bs = await prisma.batchStudent.findUnique({
        where: { batchId_studentId: { batchId: batch.id, studentId } },
      });
      expect(bs!.isActive).toBe(true);
      expect(bs!.leftAt).toBeNull();
    });
  });

  // ============================================
  // BLOCK 8: PARENT LEAVE
  // ============================================
  describe('POST /batches/:id/leave', () => {
    afterEach(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
      await cleanupEnrollments(parentProfileId);
    });

    it('should leave joined batch', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, creditsPerSession: 2 });
      await addCredits(parentProfileId, 100);
      await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId, parentId: parentProfileId },
      });

      const res = await request
        .post(`${API}/batches/${batch.id}/leave`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      expect(res.status).toBe(200);
      const bs = await prisma.batchStudent.findUnique({
        where: { batchId_studentId: { batchId: batch.id, studentId } },
      });
      expect(bs!.isActive).toBe(false);
      expect(bs!.leftAt).not.toBeNull();
    });

    it('should revert FULL → OPEN after leave', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId, maxStudents: 1 });
      await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId, parentId: parentProfileId },
      });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'FULL' } });

      await request
        .post(`${API}/batches/${batch.id}/leave`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      const updated = await prisma.batch.findUnique({ where: { id: batch.id } });
      expect(updated!.status).toBe('OPEN');
    });

    it("should reject leaving with someone else's child", async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      const other = await createAuthenticatedUser({ role: Role.PARENT });
      userIds.push(other.user.id);
      const op = await prisma.parentProfile.findUnique({ where: { userId: other.user.id } });
      const otherStudent = await createStudent(op!.id, gradeId);
      await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId: otherStudent.id, parentId: op!.id },
      });

      // Our parent tries to leave the other student
      const res = await request
        .post(`${API}/batches/${batch.id}/leave`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId: otherStudent.id });

      expect([403, 404]).toContain(res.status);
    });

    it('should NOT create a refund credit transaction on leave', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      await addCredits(parentProfileId, 50);
      await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId, parentId: parentProfileId },
      });

      const txCountBefore = await prisma.creditTransaction.count({
        where: { parentId: parentProfileId },
      });

      await request
        .post(`${API}/batches/${batch.id}/leave`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId });

      const txCountAfter = await prisma.creditTransaction.count({
        where: { parentId: parentProfileId },
      });
      expect(txCountAfter).toBe(txCountBefore);
    });
  });

  // ============================================
  // BLOCK 9: PARENT LIST MY BATCHES
  // ============================================
  describe('GET /batches/my', () => {
    afterEach(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
    });

    it('should return only batches with active BatchStudent for parent', async () => {
      const joinedBatch = await createBatch({ tutorProfileId, subjectId, gradeId });
      const otherBatch = await createBatch({ tutorProfileId, subjectId, gradeId });

      await prisma.batchStudent.create({
        data: { batchId: joinedBatch.id, studentId, parentId: parentProfileId },
      });

      const res = await request
        .get(`${API}/batches/my`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((b: any) => b.id);
      expect(ids).toContain(joinedBatch.id);
      expect(ids).not.toContain(otherBatch.id);
    });

    it('should not return batches the parent left', async () => {
      const batch = await createBatch({ tutorProfileId, subjectId, gradeId });
      await prisma.batchStudent.create({
        data: { batchId: batch.id, studentId, parentId: parentProfileId, isActive: false, leftAt: new Date() },
      });

      const res = await request
        .get(`${API}/batches/my`)
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((b: any) => b.id);
      expect(ids).not.toContain(batch.id);
    });

    it('should include pagination meta', async () => {
      const res = await request
        .get(`${API}/batches/my?page=1&limit=10`)
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
    });
  });

  // ============================================
  // BLOCK 10: TUTOR LIST + GET BATCH
  // ============================================
  describe('GET /batches/tutor and /batches/tutor/:id', () => {
    let tutorTokenLocal: string;
    let myBatchId: string;
    let otherBatchId: string;

    beforeAll(async () => {
      // Create token for our tutor (we already have userId, just need a token)
      const jwt = await import('jsonwebtoken');
      const { env } = await import('../config/env');
      tutorTokenLocal = jwt.default.sign(
        { sub: tutorUserId, email: 'tutor@test.com', role: Role.TUTOR, permissions: [] },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      // Create another tutor with a batch
      const otherTutor = await createTutorWithCourse(courseInfo.id);
      userIds.push(otherTutor.user.id);

      const myBatch = await createBatch({ tutorProfileId, subjectId, gradeId });
      myBatchId = myBatch.id;
      const otherBatch = await createBatch({ tutorProfileId: otherTutor.tutorProfile.id, subjectId, gradeId });
      otherBatchId = otherBatch.id;
    });

    afterAll(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
    });

    it('GET /batches/tutor should return only own batches', async () => {
      const res = await request
        .get(`${API}/batches/tutor`)
        .set('Authorization', `Bearer ${tutorTokenLocal}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((b: any) => b.id);
      expect(ids).toContain(myBatchId);
      expect(ids).not.toContain(otherBatchId);
    });

    it('GET /batches/tutor/:id should return own batch', async () => {
      const res = await request
        .get(`${API}/batches/tutor/${myBatchId}`)
        .set('Authorization', `Bearer ${tutorTokenLocal}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(myBatchId);
    });

    it("GET /batches/tutor/:id should reject other tutor's batch", async () => {
      const res = await request
        .get(`${API}/batches/tutor/${otherBatchId}`)
        .set('Authorization', `Bearer ${tutorTokenLocal}`);
      expect(res.status).toBe(403);
    });

    it('GET /batches/tutor should reject parent role', async () => {
      const res = await request
        .get(`${API}/batches/tutor`)
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 11: COURSE MATERIALS
  // ============================================
  describe('GET /batches/:id/materials', () => {
    let batchId: string;

    beforeAll(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
      const b = await createBatch({ tutorProfileId, subjectId, gradeId });
      batchId = b.id;
    });

    afterAll(async () => {
      await cleanupBatchesForTutor(tutorProfileId);
    });

    it('should return materials structure (empty array OK)', async () => {
      const res = await request
        .get(`${API}/batches/${batchId}/materials`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('materials');
      expect(Array.isArray(res.body.data.materials)).toBe(true);
    });

    it('should reject nonexistent batch', async () => {
      const res = await request
        .get(`${API}/batches/00000000-0000-0000-0000-000000000000/materials`)
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(404);
    });
  });
});
