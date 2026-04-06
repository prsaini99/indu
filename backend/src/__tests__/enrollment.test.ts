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

// Shared fixtures (reused across blocks for setup speed)
let course: { id: string; subjectId: string; gradeId: string };
let subjectId: string;
let gradeId: string;

// Parent + student fixtures (re-seeded per test where state matters)
let parentToken: string;
let parentUserId: string;
let parentProfileId: string;
let studentId: string;

// Tutor fixtures
let tutorUserId: string;
let tutorProfileId: string;

// Admin token
let adminToken: string;

// Helper: create a fresh parent + student + tutor + credits and return an ACTIVE enrollment
async function seedActiveEnrollment(opts: { credits?: number; schedule?: { dayOfWeek: number; startTime: string }[] } = {}) {
  const credits = opts.credits ?? 100;
  // Use a schedule far in the future (Saturday at a late hour to avoid past-time skip on most test runs)
  const schedule = opts.schedule ?? [{ dayOfWeek: 6, startTime: '20:00' }];

  // Defensive: ensure no leftover state from previous test
  await cleanupEnrollments(parentProfileId);

  await addCredits(parentProfileId, credits);

  const res = await request
    .post(`${API}/enrollments`)
    .set('Authorization', `Bearer ${parentToken}`)
    .send({ studentId, subjectId, schedule, duration: 60 });

  if (res.status !== 201) {
    throw new Error(`Failed to seed enrollment: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

beforeAll(async () => {
  // Get/create the seed course (Mathematics — Grade 5)
  const seed = await getOrCreateCourse();
  course = { id: seed.course.id, subjectId: seed.subject.id, gradeId: seed.grade.id };
  subjectId = seed.subject.id;
  gradeId = seed.grade.id;

  // Create a tutor with availability + tutorCourse
  const tutor = await createTutorWithCourse(course.id);
  tutorUserId = tutor.user.id;
  tutorProfileId = tutor.tutorProfile.id;
  userIds.push(tutorUserId);

  // Create a parent
  const parent = await createAuthenticatedUser({ role: Role.PARENT, firstName: 'Test', lastName: 'Parent' });
  parentToken = parent.token;
  parentUserId = parent.user.id;
  userIds.push(parentUserId);

  const pp = await prisma.parentProfile.findUnique({ where: { userId: parent.user.id } });
  parentProfileId = pp!.id;

  // Create student under parent
  const student = await createStudent(parentProfileId, gradeId);
  studentId = student.id;

  // Create admin
  const admin = await createSuperAdmin();
  adminToken = admin.token;
  userIds.push(admin.user.id);
});

afterAll(async () => {
  // Clean up enrollments + sessions + credit transactions before users
  if (parentProfileId) await cleanupEnrollments(parentProfileId);
  for (const id of userIds) await cleanupUser(id);
});

describe('M7: Enrollment Module', () => {
  // ============================================
  // BLOCK 1: CREATE ENROLLMENT
  // ============================================
  describe('POST /enrollments — Create Enrollment', () => {
    it('should create enrollment with valid schedule + sufficient credits', async () => {
      await addCredits(parentProfileId, 50);
      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId,
          schedule: [{ dayOfWeek: 6, startTime: '21:00' }],
          duration: 60,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.tutorId).toBe(tutorProfileId);
      expect(res.body.data.creditsPerSession).toBeGreaterThan(0);

      // Cleanup for next test
      await cleanupEnrollments(parentProfileId);
    });

    it('should reject with INSUFFICIENT_CREDITS when balance too low', async () => {
      await cleanupEnrollments(parentProfileId);
      // No credits added
      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId,
          schedule: [{ dayOfWeek: 6, startTime: '21:00' }],
          duration: 60,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('should reject duplicate active enrollment for same student+subject (409)', async () => {
      await cleanupEnrollments(parentProfileId);
      await seedActiveEnrollment({ credits: 100 });

      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId,
          schedule: [{ dayOfWeek: 5, startTime: '21:00' }],
          duration: 60,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_ENROLLMENT');

      await cleanupEnrollments(parentProfileId);
    });

    it('should reject when student does not belong to parent (404)', async () => {
      // Create a different parent + student
      const other = await createAuthenticatedUser({ role: Role.PARENT });
      userIds.push(other.user.id);
      const otherProfile = await prisma.parentProfile.findUnique({ where: { userId: other.user.id } });
      const otherStudent = await createStudent(otherProfile!.id, gradeId);

      await addCredits(parentProfileId, 100);
      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId: otherStudent.id,
          subjectId,
          schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
          duration: 60,
        });

      expect(res.status).toBe(404);
    });

    it('should reject for nonexistent subject (404)', async () => {
      await addCredits(parentProfileId, 100);
      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId: '00000000-0000-0000-0000-000000000000',
          schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
          duration: 60,
        });

      expect(res.status).toBe(404);
    });

    it('should reject schedule with duplicate days (validator)', async () => {
      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId,
          schedule: [
            { dayOfWeek: 1, startTime: '10:00' },
            { dayOfWeek: 1, startTime: '14:00' },
          ],
          duration: 60,
        });

      expect(res.status).toBe(400);
    });

    it('should reject schedule with invalid dayOfWeek (>6)', async () => {
      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId,
          schedule: [{ dayOfWeek: 7, startTime: '10:00' }],
          duration: 60,
        });

      expect(res.status).toBe(400);
    });

    it('should reject invalid duration (e.g. 75)', async () => {
      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId,
          schedule: [{ dayOfWeek: 6, startTime: '20:00' }],
          duration: 75,
        });

      expect(res.status).toBe(400);
    });

    it('should reject invalid startTime format', async () => {
      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId,
          schedule: [{ dayOfWeek: 6, startTime: '25:00' }],
          duration: 60,
        });

      expect(res.status).toBe(400);
    });

    it('should reject empty schedule', async () => {
      const res = await request
        .post(`${API}/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          subjectId,
          schedule: [],
          duration: 60,
        });

      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // BLOCK 2: CANCEL SINGLE SESSION (24-HOUR RULE)
  // ============================================
  describe('PATCH /enrollment-sessions/:id/cancel — 24hr Rule', () => {
    let enrollmentId: string;

    beforeAll(async () => {
      await cleanupEnrollments(parentProfileId);
      const enr = await seedActiveEnrollment({ credits: 200 });
      enrollmentId = enr.id;
    });

    afterAll(async () => {
      await cleanupEnrollments(parentProfileId);
    });

    it('should refund credits and set status CANCELLED_PARENT when ≥24hrs notice', async () => {
      // Find a session that is far in the future
      const sessions = await prisma.enrollmentSession.findMany({
        where: { enrollmentId, status: { in: ['CONFIRMED', 'SCHEDULED'] } },
        orderBy: { scheduledDate: 'desc' },
      });
      // Manually push session date 7 days into the future to guarantee 24hr+
      const sessionToCancel = sessions[0];
      const future = new Date();
      future.setDate(future.getDate() + 7);
      await prisma.enrollmentSession.update({
        where: { id: sessionToCancel.id },
        data: { scheduledDate: future },
      });

      const res = await request
        .patch(`${API}/enrollment-sessions/${sessionToCancel.id}/cancel`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ reason: 'Test cancel' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED_PARENT');

      // Verify a refund credit transaction was created
      const refund = await prisma.creditTransaction.findFirst({
        where: {
          parentId: parentProfileId,
          type: 'ADMIN_ADJUSTMENT',
          description: { contains: 'Refund: cancelled session' },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(refund).not.toBeNull();
      expect(refund!.amount).toBe(sessionToCancel.creditsCharged);
    });

    it('should NOT refund and set status CANCELLED_LATE when <24hrs notice', async () => {
      // Get a fresh session
      const sessions = await prisma.enrollmentSession.findMany({
        where: { enrollmentId, status: { in: ['CONFIRMED', 'SCHEDULED'] } },
      });
      if (sessions.length === 0) return; // skip if none left

      const sessionToCancel = sessions[0];
      // Push the session to 1 hour from now (within 24hr window)
      const soon = new Date();
      soon.setHours(soon.getHours() + 1);
      await prisma.enrollmentSession.update({
        where: { id: sessionToCancel.id },
        data: { scheduledDate: soon },
      });

      const balanceBefore = await prisma.creditTransaction.aggregate({
        where: { parentId: parentProfileId },
        _count: true,
      });

      const res = await request
        .patch(`${API}/enrollment-sessions/${sessionToCancel.id}/cancel`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ reason: 'Late cancel' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED_LATE');

      // Verify NO new refund transaction was created
      const balanceAfter = await prisma.creditTransaction.aggregate({
        where: { parentId: parentProfileId },
        _count: true,
      });
      expect(balanceAfter._count).toBe(balanceBefore._count);
    });

    it('should reject cancelling a session not belonging to parent (403)', async () => {
      const other = await createAuthenticatedUser({ role: Role.PARENT });
      userIds.push(other.user.id);

      const sessions = await prisma.enrollmentSession.findMany({
        where: { enrollmentId, status: { in: ['CONFIRMED', 'SCHEDULED'] } },
      });
      if (sessions.length === 0) return;

      const res = await request
        .patch(`${API}/enrollment-sessions/${sessions[0].id}/cancel`)
        .set('Authorization', `Bearer ${other.token}`)
        .send({});

      expect(res.status).toBe(403);
    });

    it('should reject cancelling nonexistent session (404)', async () => {
      const res = await request
        .patch(`${API}/enrollment-sessions/00000000-0000-0000-0000-000000000000/cancel`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it('should reject cancelling an already-cancelled session', async () => {
      // Create a session manually with CANCELLED_PARENT status
      const cancelled = await prisma.enrollmentSession.create({
        data: {
          enrollmentId,
          status: 'CANCELLED_PARENT',
          scheduledDate: new Date(Date.now() + 86400000),
          scheduledStart: '20:00',
          scheduledEnd: '21:00',
          creditsCharged: 0,
        },
      });

      const res = await request
        .patch(`${API}/enrollment-sessions/${cancelled.id}/cancel`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });
  });

  // ============================================
  // BLOCK 3: PAUSE / RESUME
  // ============================================
  describe('PATCH /enrollments/:id/pause and /resume', () => {
    beforeAll(async () => {
      await cleanupEnrollments(parentProfileId);
    });

    afterAll(async () => {
      await cleanupEnrollments(parentProfileId);
    });

    it('should pause an active enrollment and refund future sessions', async () => {
      const enr = await seedActiveEnrollment({ credits: 200 });

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/pause`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAUSED');
      expect(res.body.data.lastPausedAt).toBeTruthy();
      expect(res.body.data.pauseCountMonth).toBeGreaterThanOrEqual(1);

      await cleanupEnrollments(parentProfileId);
    });

    it('should reject resuming within 48hrs of pause (COOLDOWN)', async () => {
      const enr = await seedActiveEnrollment({ credits: 200 });
      // Pause it
      await request.patch(`${API}/enrollments/${enr.id}/pause`).set('Authorization', `Bearer ${parentToken}`);

      // Try to resume immediately
      const res = await request
        .patch(`${API}/enrollments/${enr.id}/resume`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('COOLDOWN');

      await cleanupEnrollments(parentProfileId);
    });

    it('should resume a paused enrollment after cooldown bypassed', async () => {
      const enr = await seedActiveEnrollment({ credits: 200 });
      await request.patch(`${API}/enrollments/${enr.id}/pause`).set('Authorization', `Bearer ${parentToken}`);

      // Manually backdate lastPausedAt to bypass cooldown
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 49);
      await prisma.enrollment.update({ where: { id: enr.id }, data: { lastPausedAt: pastDate } });

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/resume`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.lastResumedAt).toBeTruthy();

      await cleanupEnrollments(parentProfileId);
    });

    it('should reject pausing within 48hrs of last resume (COOLDOWN)', async () => {
      const enr = await seedActiveEnrollment({ credits: 300 });
      await request.patch(`${API}/enrollments/${enr.id}/pause`).set('Authorization', `Bearer ${parentToken}`);
      // Bypass pause cooldown for resume
      const past = new Date();
      past.setHours(past.getHours() - 49);
      await prisma.enrollment.update({ where: { id: enr.id }, data: { lastPausedAt: past } });
      await request.patch(`${API}/enrollments/${enr.id}/resume`).set('Authorization', `Bearer ${parentToken}`);

      // Now try to pause again immediately
      const res = await request
        .patch(`${API}/enrollments/${enr.id}/pause`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('COOLDOWN');

      await cleanupEnrollments(parentProfileId);
    });

    it('should reject pausing a non-active enrollment', async () => {
      const enr = await seedActiveEnrollment({ credits: 200 });
      await request.patch(`${API}/enrollments/${enr.id}/pause`).set('Authorization', `Bearer ${parentToken}`);

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/pause`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');

      await cleanupEnrollments(parentProfileId);
    });

    it('should reject pausing when monthly limit (3) exceeded', async () => {
      const enr = await seedActiveEnrollment({ credits: 300 });
      // Manually set pauseCountMonth to 3 in current month
      await prisma.enrollment.update({
        where: { id: enr.id },
        data: { pauseCountMonth: 3, pauseCountResetAt: new Date() },
      });

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/pause`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PAUSE_LIMIT');

      await cleanupEnrollments(parentProfileId);
    });

    it('should reset pause count on new month', async () => {
      const enr = await seedActiveEnrollment({ credits: 300 });
      // Set pauseCountResetAt to 2 months ago with 3 pauses used
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      await prisma.enrollment.update({
        where: { id: enr.id },
        data: { pauseCountMonth: 3, pauseCountResetAt: twoMonthsAgo },
      });

      // Should now allow pause (count auto-resets)
      const res = await request
        .patch(`${API}/enrollments/${enr.id}/pause`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAUSED');
      expect(res.body.data.pauseCountMonth).toBe(1); // Reset to 1 (this pause)

      await cleanupEnrollments(parentProfileId);
    });

    it('should reject pausing not your enrollment (404)', async () => {
      const enr = await seedActiveEnrollment({ credits: 200 });

      const other = await createAuthenticatedUser({ role: Role.PARENT });
      userIds.push(other.user.id);
      // Other parent needs profile created
      await prisma.parentProfile.findUnique({ where: { userId: other.user.id } });

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/pause`)
        .set('Authorization', `Bearer ${other.token}`);

      expect(res.status).toBe(404);

      await cleanupEnrollments(parentProfileId);
    });

    it('should reject resuming when balance insufficient', async () => {
      const enr = await seedActiveEnrollment({ credits: 200 });
      await request.patch(`${API}/enrollments/${enr.id}/pause`).set('Authorization', `Bearer ${parentToken}`);
      // Bypass cooldown
      const past = new Date();
      past.setHours(past.getHours() - 49);
      await prisma.enrollment.update({ where: { id: enr.id }, data: { lastPausedAt: past } });

      // Drain credits
      const balance = await prisma.creditTransaction.findMany({ where: { parentId: parentProfileId } });
      let total = 0;
      for (const t of balance) {
        if (t.type === 'DEDUCTION') total -= t.amount;
        else total += t.amount;
      }
      if (total > 0) {
        await prisma.creditTransaction.create({
          data: { parentId: parentProfileId, type: 'DEDUCTION', amount: total, description: 'Test drain' },
        });
      }

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/resume`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INSUFFICIENT_CREDITS');

      await cleanupEnrollments(parentProfileId);
    });
  });

  // ============================================
  // BLOCK 4: CANCEL ENROLLMENT
  // ============================================
  describe('PATCH /enrollments/:id/cancel — Full Enrollment Cancellation', () => {
    beforeAll(async () => {
      await cleanupEnrollments(parentProfileId);
    });

    afterAll(async () => {
      await cleanupEnrollments(parentProfileId);
    });

    it('should cancel active enrollment and refund all future sessions', async () => {
      const enr = await seedActiveEnrollment({ credits: 300 });

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/cancel`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ reason: 'No longer needed' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(res.body.data.cancelReason).toBeTruthy();
      expect(res.body.data.zoomLink).toBeNull();
      expect(res.body.data.zoomMeetingId).toBeNull();

      await cleanupEnrollments(parentProfileId);
    });

    it('should reject cancelling already-cancelled enrollment', async () => {
      const enr = await seedActiveEnrollment({ credits: 200 });
      await request.patch(`${API}/enrollments/${enr.id}/cancel`).set('Authorization', `Bearer ${parentToken}`);

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/cancel`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');

      await cleanupEnrollments(parentProfileId);
    });

    it('should reject cancelling not your enrollment (404)', async () => {
      const enr = await seedActiveEnrollment({ credits: 200 });

      const other = await createAuthenticatedUser({ role: Role.PARENT });
      userIds.push(other.user.id);

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/cancel`)
        .set('Authorization', `Bearer ${other.token}`);

      expect(res.status).toBe(404);

      await cleanupEnrollments(parentProfileId);
    });

    it('should also be able to cancel a PAUSED enrollment', async () => {
      const enr = await seedActiveEnrollment({ credits: 200 });
      await request.patch(`${API}/enrollments/${enr.id}/pause`).set('Authorization', `Bearer ${parentToken}`);

      const res = await request
        .patch(`${API}/enrollments/${enr.id}/cancel`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');

      await cleanupEnrollments(parentProfileId);
    });
  });

  // ============================================
  // BLOCK 5: LIST & GET
  // ============================================
  describe('GET /enrollments/my, /:id, /:id/sessions, /:id/materials', () => {
    let enrollmentId: string;

    beforeAll(async () => {
      await cleanupEnrollments(parentProfileId);
      const enr = await seedActiveEnrollment({ credits: 200 });
      enrollmentId = enr.id;
    });

    afterAll(async () => {
      await cleanupEnrollments(parentProfileId);
    });

    it('GET /enrollments/my should return only own enrollments', async () => {
      const res = await request
        .get(`${API}/enrollments/my`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every((e: any) => e.parentId === parentProfileId)).toBe(true);
    });

    it('GET /enrollments/my?status=ACTIVE should filter by status', async () => {
      const res = await request
        .get(`${API}/enrollments/my?status=ACTIVE`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((e: any) => e.status === 'ACTIVE')).toBe(true);
    });

    it('GET /enrollments/:id as owner should return enrollment', async () => {
      const res = await request
        .get(`${API}/enrollments/${enrollmentId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(enrollmentId);
    });

    it('GET /enrollments/:id as different parent should 403/404', async () => {
      const other = await createAuthenticatedUser({ role: Role.PARENT });
      userIds.push(other.user.id);

      const res = await request
        .get(`${API}/enrollments/${enrollmentId}`)
        .set('Authorization', `Bearer ${other.token}`);

      // Service returns 403 ('Forbidden') based on getById logic
      expect([403, 404]).toContain(res.status);
    });

    it('GET /enrollments/:id/sessions should return sessions', async () => {
      const res = await request
        .get(`${API}/enrollments/${enrollmentId}/sessions`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /enrollments/:id/materials should return materials structure', async () => {
      const res = await request
        .get(`${API}/enrollments/${enrollmentId}/materials`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('materials');
      expect(Array.isArray(res.body.data.materials)).toBe(true);
    });
  });

  // ============================================
  // BLOCK 6: NO-SHOW WORKFLOW
  // ============================================
  describe('PATCH /enrollment-sessions/:id/report-no-show + admin review', () => {
    let enrollmentId: string;

    beforeAll(async () => {
      await cleanupEnrollments(parentProfileId);
      const enr = await seedActiveEnrollment({ credits: 200 });
      enrollmentId = enr.id;
    });

    afterAll(async () => {
      await cleanupEnrollments(parentProfileId);
    });

    it('should report no-show within 24hrs of session end', async () => {
      // Create a session that ended 1 hour ago
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const session = await prisma.enrollmentSession.create({
        data: {
          enrollmentId,
          status: 'CONFIRMED',
          scheduledDate: oneHourAgo,
          scheduledStart: '00:00',
          scheduledEnd: '00:30',
          creditsCharged: 2,
          creditDeductedAt: new Date(),
        },
      });

      const res = await request
        .patch(`${API}/enrollment-sessions/${session.id}/report-no-show`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('NO_SHOW_REPORTED');
    });

    it('should reject no-show report >24hrs after session end (TOO_LATE)', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const session = await prisma.enrollmentSession.create({
        data: {
          enrollmentId,
          status: 'COMPLETED',
          scheduledDate: twoDaysAgo,
          scheduledStart: '10:00',
          scheduledEnd: '11:00',
          creditsCharged: 2,
        },
      });

      const res = await request
        .patch(`${API}/enrollment-sessions/${session.id}/report-no-show`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TOO_LATE');
    });

    it('should reject no-show report on session not COMPLETED/CONFIRMED', async () => {
      const session = await prisma.enrollmentSession.create({
        data: {
          enrollmentId,
          status: 'CANCELLED_PARENT',
          scheduledDate: new Date(),
          scheduledStart: '10:00',
          scheduledEnd: '11:00',
          creditsCharged: 0,
        },
      });

      const res = await request
        .patch(`${API}/enrollment-sessions/${session.id}/report-no-show`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });

    it('admin APPROVE should refund credits and add tutor strike', async () => {
      // Create + report a no-show (unique start time to avoid unique constraint clash)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const session = await prisma.enrollmentSession.create({
        data: {
          enrollmentId,
          status: 'NO_SHOW_REPORTED',
          scheduledDate: oneHourAgo,
          scheduledStart: '01:00',
          scheduledEnd: '01:30',
          creditsCharged: 2,
          creditDeductedAt: new Date(),
        },
      });

      const tutorBefore = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
      const strikesBefore = tutorBefore?.noShowStrikes || 0;

      const res = await request
        .patch(`${API}/admin/enrollment-sessions/${session.id}/review-no-show`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'APPROVE', notes: 'Confirmed' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('MISSED_TUTOR');

      // Verify refund created
      const refund = await prisma.creditTransaction.findFirst({
        where: {
          parentId: parentProfileId,
          type: 'ADMIN_ADJUSTMENT',
          description: { contains: 'Refund: tutor no-show' },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(refund).not.toBeNull();

      // Verify strike incremented
      const tutorAfter = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
      expect(tutorAfter!.noShowStrikes).toBeGreaterThan(strikesBefore);
    });

    it('admin REJECT should revert to COMPLETED with no refund or strike', async () => {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const session = await prisma.enrollmentSession.create({
        data: {
          enrollmentId,
          status: 'NO_SHOW_REPORTED',
          scheduledDate: oneHourAgo,
          scheduledStart: '02:00',
          scheduledEnd: '02:30',
          creditsCharged: 2,
          creditDeductedAt: new Date(),
        },
      });

      const tutorBefore = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
      const strikesBefore = tutorBefore?.noShowStrikes || 0;

      const res = await request
        .patch(`${API}/admin/enrollment-sessions/${session.id}/review-no-show`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'REJECT', notes: 'Disputed' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');

      // Verify strike NOT incremented
      const tutorAfter = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
      expect(tutorAfter!.noShowStrikes).toBe(strikesBefore);
    });
  });

  // ============================================
  // BLOCK 7: ADMIN ENDPOINTS
  // ============================================
  describe('Admin enrollment endpoints', () => {
    let enrollmentId: string;

    beforeAll(async () => {
      await cleanupEnrollments(parentProfileId);
      const enr = await seedActiveEnrollment({ credits: 300 });
      enrollmentId = enr.id;
    });

    afterAll(async () => {
      await cleanupEnrollments(parentProfileId);
    });

    it('GET /admin/enrollments as admin should return paginated list', async () => {
      const res = await request
        .get(`${API}/admin/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('GET /admin/enrollments as parent should be 403', async () => {
      const res = await request
        .get(`${API}/admin/enrollments`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
    });

    it('PATCH /admin/enrollments/:id/pause as admin', async () => {
      const res = await request
        .patch(`${API}/admin/enrollments/${enrollmentId}/pause`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Admin pause' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAUSED');
    });

    it('PATCH /admin/enrollments/:id/resume as admin', async () => {
      const res = await request
        .patch(`${API}/admin/enrollments/${enrollmentId}/resume`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('PATCH /admin/enrollments/:id/cancel as admin', async () => {
      const res = await request
        .patch(`${API}/admin/enrollments/${enrollmentId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Admin cancel' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('GET /admin/enrollments/:id/tutors should list reassignment candidates', async () => {
      // Need a non-cancelled enrollment
      await cleanupEnrollments(parentProfileId);
      const enr = await seedActiveEnrollment({ credits: 200 });

      const res = await request
        .get(`${API}/admin/enrollments/${enr.id}/tutors`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ============================================
  // BLOCK 8: AVAILABLE SLOTS
  // ============================================
  describe('GET /enrollments/available-slots', () => {
    it('should return slots when active tutor exists for subject+grade', async () => {
      const res = await request
        .get(`${API}/enrollments/available-slots?subjectId=${subjectId}&gradeId=${gradeId}&duration=60`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      // Response shape: { slots: [...], message?: string }
      expect(res.body.data).toHaveProperty('slots');
      expect(Array.isArray(res.body.data.slots)).toBe(true);
    });

    it('should reject missing query params (validator)', async () => {
      const res = await request
        .get(`${API}/enrollments/available-slots`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
    });

    it('should reject non-numeric duration', async () => {
      const res = await request
        .get(`${API}/enrollments/available-slots?subjectId=${subjectId}&gradeId=${gradeId}&duration=abc`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(400);
    });
  });
});
