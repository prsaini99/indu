import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import {
  request,
  API,
  createAuthenticatedUser,
  createSuperAdmin,
  cleanupUser,
  getAnyGradeId,
} from './helpers';

const userIds: string[] = [];
let parentToken: string;
let parentUserId: string;
let adminToken: string;
let adminUserId: string;
let gradeId: string;

beforeAll(async () => {
  // Create a parent
  const parent = await createAuthenticatedUser({ role: Role.PARENT, firstName: 'Jane', lastName: 'Parent' });
  parentToken = parent.token;
  parentUserId = parent.user.id;
  userIds.push(parent.user.id);

  // Create a super admin
  const admin = await createSuperAdmin();
  adminToken = admin.token;
  adminUserId = admin.user.id;
  userIds.push(admin.user.id);

  // Get reference data
  gradeId = (await getAnyGradeId()) || '';
});

afterAll(async () => {
  for (const id of userIds) await cleanupUser(id);
});

describe('M2: User Management', () => {
  // ==========================================
  // PARENT PROFILE
  // ==========================================
  describe('Parent Profile', () => {
    it('GET /parents/profile should return parent profile', async () => {
      const res = await request
        .get(`${API}/parents/profile`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Jane');
    });

    it('PATCH /parents/profile should update profile', async () => {
      const res = await request
        .patch(`${API}/parents/profile`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ phone: '+971501234567' });

      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe('+971501234567');
    });

    it('should reject non-parent role', async () => {
      const res = await request
        .get(`${API}/parents/profile`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // CHILDREN (read-only — children are admin-managed)
  // ==========================================
  describe('Children (parent read access)', () => {
    beforeAll(async () => {
      if (!gradeId) return;
      // Seed a child directly via DB (parents can't self-create — admin-only)
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: parentUserId },
      });
      if (parentProfile) {
        await prisma.student.create({
          data: {
            parentId: parentProfile.id,
            firstName: 'Ali',
            lastName: 'Parent',
            gradeId,
          },
        });
      }
    });

    it('GET /parents/children should list children', async () => {
      const res = await request
        .get(`${API}/parents/children`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((c: { firstName: string }) => c.firstName === 'Ali')).toBe(true);
    });

    it('should reject non-parent role', async () => {
      const res = await request
        .get(`${API}/parents/children`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // ADMIN USER MANAGEMENT
  // ==========================================
  describe('Admin User Management', () => {
    let createdUserId: string;

    it('GET /admin/users should list users', async () => {
      const res = await request
        .get(`${API}/admin/users`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /admin/users should create a user', async () => {
      const res = await request
        .post(`${API}/admin/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `created-${Date.now()}@test.com`,
          password: 'Temp1234!',
          firstName: 'New',
          lastName: 'Tutor',
          role: 'TUTOR',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      createdUserId = res.body.data.id;
      userIds.push(createdUserId);
    });

    it('GET /admin/users/:id should return user details', async () => {
      if (!createdUserId) return;

      const res = await request
        .get(`${API}/admin/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdUserId);
    });

    it('PATCH /admin/users/:id/status should toggle status', async () => {
      if (!createdUserId) return;

      const res = await request
        .patch(`${API}/admin/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);

      // Re-activate
      await request
        .patch(`${API}/admin/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
    });

    it('PUT /admin/users/:id/permissions should set permissions', async () => {
      if (!createdUserId) return;

      // Create an admin user to set permissions on
      const adminUser = await createAuthenticatedUser({ role: Role.ADMIN });
      userIds.push(adminUser.user.id);

      const res = await request
        .put(`${API}/admin/users/${adminUser.user.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['USER_MANAGEMENT', 'TUTOR_MANAGEMENT'] });

      expect(res.status).toBe(200);
    });

    it('GET /admin/users/:id/permissions should return permissions', async () => {
      const res = await request
        .get(`${API}/admin/users/${adminUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject non-admin access', async () => {
      const res = await request
        .get(`${API}/admin/users`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated access', async () => {
      const res = await request.get(`${API}/admin/users`);
      expect(res.status).toBe(401);
    });
  });
});
