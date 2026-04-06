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

// Clean up test users (call in afterAll or afterEach)
export async function cleanupUser(userId: string) {
  try {
    // Delete in correct order to respect FK constraints
    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (tutorProfile) {
      await prisma.availabilityTemplate.deleteMany({ where: { tutorId: tutorProfile.id } });
      await prisma.blockedDate.deleteMany({ where: { tutorId: tutorProfile.id } });
      await prisma.tutorCertification.deleteMany({ where: { tutorId: tutorProfile.id } });
      await prisma.tutorCourse.deleteMany({ where: { tutorId: tutorProfile.id } });
      await prisma.tutorProfile.delete({ where: { userId } });
    }

    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (parentProfile) {
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
