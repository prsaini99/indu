import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import {
  request,
  API,
  createAuthenticatedUser,
  createSuperAdmin,
  cleanupUser,
  getAnySubjectId,
} from './helpers';

const userIds: string[] = [];
let tutorToken: string;
let tutorProfileId: string;
let adminToken: string;
let subjectId: string | null;

beforeAll(async () => {
  // Create a tutor
  const tutor = await createAuthenticatedUser({ role: Role.TUTOR, firstName: 'Raj', lastName: 'Sharma' });
  tutorToken = tutor.token;
  userIds.push(tutor.user.id);

  // Get tutor profile ID
  const profile = await prisma.tutorProfile.findUnique({ where: { userId: tutor.user.id } });
  tutorProfileId = profile!.id;

  // Create admin
  const admin = await createSuperAdmin();
  adminToken = admin.token;
  userIds.push(admin.user.id);

  // Get a subject
  subjectId = await getAnySubjectId();
});

afterAll(async () => {
  for (const id of userIds) await cleanupUser(id);
});

describe('M3: Tutor Management', () => {
  // ==========================================
  // TUTOR SELF-MANAGEMENT
  // ==========================================
  describe('Tutor Self-Management', () => {
    it('GET /tutors/profile should return own profile', async () => {
      const res = await request
        .get(`${API}/tutors/profile`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(tutorProfileId);
      expect(res.body.data.firstName).toBe('Raj');
    });

    it('PATCH /tutors/profile should update bio and experience', async () => {
      const res = await request
        .patch(`${API}/tutors/profile`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ bio: 'Expert math tutor', experience: 7 });

      expect(res.status).toBe(200);
      expect(res.body.data.bio).toBe('Expert math tutor');
      expect(res.body.data.experience).toBe(7);
    });

    it('GET /tutors/my-students should return placeholder', async () => {
      const res = await request
        .get(`${API}/tutors/my-students`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /tutors/dashboard should return placeholder stats', async () => {
      const res = await request
        .get(`${API}/tutors/dashboard`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalStudents');
    });
  });

  // ==========================================
  // CERTIFICATIONS
  // ==========================================
  describe('Certifications', () => {
    let certId: string;

    it('POST /tutors/certifications should add a certification', async () => {
      const res = await request
        .post(`${API}/tutors/certifications`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          title: 'B.Ed Mathematics',
          institution: 'Delhi University',
          year: 2020,
          documentUrl: 'https://example.com/cert.pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('B.Ed Mathematics');
      certId = res.body.data.id;
    });

    it('GET /tutors/certifications should list certifications', async () => {
      const res = await request
        .get(`${API}/tutors/certifications`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('DELETE /tutors/certifications/:id should remove certification', async () => {
      const res = await request
        .delete(`${API}/tutors/certifications/${certId}`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject invalid documentUrl', async () => {
      const res = await request
        .post(`${API}/tutors/certifications`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ title: 'Test', documentUrl: 'not-a-url' });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // PUBLIC DIRECTORY
  // ==========================================
  describe('Public Directory', () => {
    it('GET /tutors should list active tutors (no auth)', async () => {
      const res = await request.get(`${API}/tutors`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('GET /tutors/:id should return public profile (no auth)', async () => {
      const res = await request.get(`${API}/tutors/${tutorProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Raj');
    });

    it('GET /tutors/:id should 404 for non-existent tutor', async () => {
      const res = await request.get(`${API}/tutors/00000000-0000-0000-0000-000000000000`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // ADMIN TUTOR MANAGEMENT
  // ==========================================
  describe('Admin Tutor Management', () => {
    it('PATCH /admin/tutors/:id should update tutor details', async () => {
      const res = await request
        .patch(`${API}/admin/tutors/${tutorProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bio: 'Admin-updated bio', experience: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.bio).toBe('Admin-updated bio');
    });

    it('PATCH /admin/tutors/:id/status should deactivate tutor', async () => {
      const res = await request
        .patch(`${API}/admin/tutors/${tutorProfileId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);

      // Re-activate for other tests
      await request
        .patch(`${API}/admin/tutors/${tutorProfileId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
    });

    it('GET /admin/tutors/:id/performance should return placeholder', async () => {
      const res = await request
        .get(`${API}/admin/tutors/${tutorProfileId}/performance`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalSessions');
    });

    it('POST /admin/tutors/:id/subjects should assign subject', async () => {
      if (!subjectId) return;

      const res = await request
        .post(`${API}/admin/tutors/${tutorProfileId}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ subjectId, tutorRate: 5000 });

      expect(res.status).toBe(201);
    });

    it('POST duplicate subject should return 409', async () => {
      if (!subjectId) return;

      const res = await request
        .post(`${API}/admin/tutors/${tutorProfileId}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ subjectId, tutorRate: 5000 });

      expect(res.status).toBe(409);
    });

    it('DELETE /admin/tutors/:id/subjects/:subjectId should remove subject', async () => {
      if (!subjectId) return;

      const res = await request
        .delete(`${API}/admin/tutors/${tutorProfileId}/subjects/${subjectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject non-admin access', async () => {
      const res = await request
        .patch(`${API}/admin/tutors/${tutorProfileId}`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ bio: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });
});
