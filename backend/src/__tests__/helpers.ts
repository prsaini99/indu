import supertest from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import app from '../app';
import prisma from '../config/database';
import { env } from '../config/env';
import { Role, Permission } from '@prisma/client';

export const request = supertest(app);
export const API = '/api/v1';

// Generate a unique email for test isolation
export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}-${uuidv4().slice(0, 8)}@test.com`;
}

// Create a user directly in the DB (bypassing signup flow)
export async function createTestUser(overrides: {
  email?: string;
  password?: string;
  role?: Role;
  isEmailVerified?: boolean;
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
} = {}) {
  const email = overrides.email || uniqueEmail();
  const password = overrides.password || 'Test1234!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: overrides.role || Role.PARENT,
      isEmailVerified: overrides.isEmailVerified ?? true,
      isActive: overrides.isActive ?? true,
    },
  });

  // Create role-specific profile
  const firstName = overrides.firstName || 'Test';
  const lastName = overrides.lastName || 'User';

  if (user.role === Role.PARENT) {
    await prisma.parentProfile.create({
      data: { userId: user.id, firstName, lastName },
    });
  } else if (user.role === Role.TUTOR) {
    await prisma.tutorProfile.create({
      data: { userId: user.id, firstName, lastName },
    });
  }

  return { user, password, email };
}

// Generate an access token for a user
export function generateToken(userId: string, email: string, role: string, permissions: Permission[] = []): string {
  return jwt.sign(
    { sub: userId, email, role, permissions },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

// Create user + return their token in one step
export async function createAuthenticatedUser(overrides: Parameters<typeof createTestUser>[0] = {}) {
  const { user, password, email } = await createTestUser(overrides);
  const token = generateToken(user.id, user.email, user.role);
  return { user, password, email, token };
}

// Create a super admin with all permissions
export async function createSuperAdmin() {
  return createAuthenticatedUser({ role: Role.SUPER_ADMIN });
}

// Clean up enrollment-related rows for a parent (FK-safe order)
export async function cleanupEnrollments(parentProfileId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { parentId: parentProfileId },
    select: { id: true },
  });
  const enrollmentIds = enrollments.map((e) => e.id);

  if (enrollmentIds.length > 0) {
    // CreditTransactions referencing enrollment sessions must be removed first
    const sessions = await prisma.enrollmentSession.findMany({
      where: { enrollmentId: { in: enrollmentIds } },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      await prisma.creditTransaction.deleteMany({
        where: { enrollmentSessionId: { in: sessionIds } },
      });
    }
    await prisma.enrollmentSession.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
    await prisma.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
  }

  // Any remaining credit transactions (admin adjustments, refunds not tied to sessions)
  await prisma.creditTransaction.deleteMany({ where: { parentId: parentProfileId } });
}

// Clean up payment-related rows for a parent (FK-safe order)
export async function cleanupPayments(parentProfileId: string) {
  const payments = await prisma.payment.findMany({
    where: { parentId: parentProfileId },
    select: { id: true },
  });
  const paymentIds = payments.map((p) => p.id);

  if (paymentIds.length > 0) {
    // CreditTransactions referencing payments must be removed first
    await prisma.creditTransaction.deleteMany({
      where: { paymentId: { in: paymentIds } },
    });
    await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } });
  }
}

// Clean up batch-related rows for a single batch (FK-safe order)
// BatchSession + BatchSessionCredit cascade delete from Batch, but linked CreditTransactions don't.
export async function cleanupBatch(batchId: string) {
  // Find all credit deductions linked to this batch's sessions
  const sessions = await prisma.batchSession.findMany({
    where: { batchId },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);

  if (sessionIds.length > 0) {
    const credits = await prisma.batchSessionCredit.findMany({
      where: { batchSessionId: { in: sessionIds } },
      select: { id: true, parentId: true },
    });
    const creditIds = credits.map((c) => c.id);

    if (creditIds.length > 0) {
      // Remove CreditTransactions linked via batchSessionCreditId
      await prisma.creditTransaction.deleteMany({
        where: { batchSessionCreditId: { in: creditIds } },
      });
      // Also remove ADMIN_ADJUSTMENT refund transactions for these parents created by refundBatchFutureSessions
      const parentIds = [...new Set(credits.map((c) => c.parentId))];
      for (const pid of parentIds) {
        await prisma.creditTransaction.deleteMany({
          where: {
            parentId: pid,
            type: 'ADMIN_ADJUSTMENT',
            description: { contains: 'Refund (batch cancelled)' },
          },
        });
      }
    }
  }

  // Cascade delete: Batch → BatchStudent + BatchSession → BatchSessionCredit
  await prisma.batch.deleteMany({ where: { id: batchId } });
}

// Clean up all batches owned by a tutor (and their linked rows)
export async function cleanupBatchesForTutor(tutorProfileId: string) {
  const batches = await prisma.batch.findMany({
    where: { tutorId: tutorProfileId },
    select: { id: true },
  });
  for (const b of batches) {
    await cleanupBatch(b.id);
  }
}

// Clean up test users (call in afterAll or afterEach)
export async function cleanupUser(userId: string) {
  try {
    // Delete in correct order to respect FK constraints
    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (tutorProfile) {
      // Remove enrollments where this tutor is referenced
      const tutorEnrollments = await prisma.enrollment.findMany({
        where: { tutorId: tutorProfile.id },
        select: { id: true, parentId: true },
      });
      const parentIds = [...new Set(tutorEnrollments.map((e) => e.parentId))];
      for (const pid of parentIds) {
        await cleanupEnrollments(pid);
      }
      // Remove batches owned by this tutor (and all their sessions, credits, etc.)
      await cleanupBatchesForTutor(tutorProfile.id);
      await prisma.availabilityTemplate.deleteMany({ where: { tutorId: tutorProfile.id } });
      await prisma.blockedDate.deleteMany({ where: { tutorId: tutorProfile.id } });
      await prisma.tutorCertification.deleteMany({ where: { tutorId: tutorProfile.id } });
      await prisma.tutorCourse.deleteMany({ where: { tutorId: tutorProfile.id } });
      await prisma.tutorProfile.delete({ where: { userId } });
    }

    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (parentProfile) {
      await cleanupEnrollments(parentProfile.id);
      await cleanupPayments(parentProfile.id);
      // Remove BatchStudent rows where this parent is referenced (from any batches)
      await prisma.batchStudent.deleteMany({ where: { parentId: parentProfile.id } });
      await prisma.student.deleteMany({ where: { parentId: parentProfile.id } });
      await prisma.parentProfile.delete({ where: { userId } });
    }

    await prisma.adminPermission.deleteMany({ where: { userId } });
    await prisma.token.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    // Ignore if already deleted
  }
}

// ──────────────────────────────────────────────
// Enrollment-specific helpers
// ──────────────────────────────────────────────

// Create a tutor with availability covering MTW 09:00-22:00 and a TutorCourse for the given course
export async function createTutorWithCourse(courseId: string) {
  const tutor = await createAuthenticatedUser({
    role: Role.TUTOR,
    firstName: 'Test',
    lastName: 'Tutor',
  });
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: tutor.user.id } });
  if (!tutorProfile) throw new Error('Tutor profile not created');

  // Wide availability: every day of week 00:00-23:30 — covers any schedule the tests pick
  const days = [0, 1, 2, 3, 4, 5, 6];
  for (const dayOfWeek of days) {
    await prisma.availabilityTemplate.create({
      data: { tutorId: tutorProfile.id, dayOfWeek, startTime: '00:00', endTime: '23:30' },
    });
  }

  // Link tutor to the course
  await prisma.tutorCourse.create({
    data: { tutorId: tutorProfile.id, courseId, tutorRate: 50000 },
  });

  return { ...tutor, tutorProfile };
}

// Create a student under a parent profile for the given grade
export async function createStudent(parentProfileId: string, gradeId: string, firstName = 'Test', lastName = 'Student') {
  return prisma.student.create({
    data: { parentId: parentProfileId, firstName, lastName, gradeId },
  });
}

// Add credits directly via a CreditTransaction (admin adjustment) so tests don't need Stripe
export async function addCredits(parentProfileId: string, amount: number) {
  return prisma.creditTransaction.create({
    data: {
      parentId: parentProfileId,
      type: 'ADMIN_ADJUSTMENT',
      amount,
      description: 'Test seed credits',
    },
  });
}

// Find a Course (subject + grade combo) — uses seed data (Mathematics — Grade 5)
export async function getOrCreateCourse() {
  const subject = await prisma.subject.findFirst({ where: { name: 'Mathematics' } });
  const grade = await prisma.gradeLevel.findFirst({ where: { name: 'Grade 5' } });
  if (!subject || !grade) throw new Error('Seed data missing — run npm run db:seed');
  let course = await prisma.course.findUnique({
    where: { subjectId_gradeId: { subjectId: subject.id, gradeId: grade.id } },
  });
  if (!course) {
    course = await prisma.course.create({
      data: { subjectId: subject.id, gradeId: grade.id, name: 'Mathematics — Grade 5' },
    });
  }
  return { course, subject, grade };
}

// ──────────────────────────────────────────────
// Payment-specific helpers
// ──────────────────────────────────────────────

// Create a CreditPackage for payment tests (unique name per call)
export async function createCreditPackage(opts: { credits?: number; priceInFils?: number; isActive?: boolean } = {}) {
  return prisma.creditPackage.create({
    data: {
      name: `Test Package ${uuidv4().slice(0, 8)}`,
      credits: opts.credits ?? 100,
      priceInFils: opts.priceInFils ?? 10000, // 100 AED
      isActive: opts.isActive ?? true,
    },
  });
}

// ──────────────────────────────────────────────
// Batch-specific helpers
// ──────────────────────────────────────────────

// Admin direct-insert a Batch (bypasses route, no Zoom call)
export async function createBatch(opts: {
  tutorProfileId: string;
  subjectId: string;
  gradeId: string;
  name?: string;
  schedule?: { dayOfWeek: number; startTime: string }[];
  duration?: number;
  minStudents?: number;
  maxStudents?: number;
  creditsPerSession?: number;
}) {
  return prisma.batch.create({
    data: {
      name: opts.name ?? `Test Batch ${uuidv4().slice(0, 8)}`,
      subjectId: opts.subjectId,
      tutorId: opts.tutorProfileId,
      gradeId: opts.gradeId,
      schedule: (opts.schedule ?? [{ dayOfWeek: 6, startTime: '20:00' }]) as any,
      duration: opts.duration ?? 60,
      minStudents: opts.minStudents ?? 1,
      maxStudents: opts.maxStudents ?? 6,
      creditsPerSession: opts.creditsPerSession ?? 2,
    },
  });
}

// Get a subject ID from the DB (for tests that need one)
export async function getAnySubjectId(): Promise<string | null> {
  const subject = await prisma.subject.findFirst();
  return subject?.id || null;
}

// Get a grade ID from the DB (for tests that need one)
export async function getAnyGradeId(): Promise<string | null> {
  const grade = await prisma.gradeLevel.findFirst();
  return grade?.id || null;
}
