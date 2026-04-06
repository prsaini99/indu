import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import {
  request,
  API,
  createAuthenticatedUser,
  cleanupUser,
} from './helpers';

const userIds: string[] = [];
let tutorToken: string;
let tutorProfileId: string;
let otherToken: string;

beforeAll(async () => {
  // Create a tutor
  const tutor = await createAuthenticatedUser({ role: Role.TUTOR, firstName: 'Avail', lastName: 'Tutor' });
  tutorToken = tutor.token;
  userIds.push(tutor.user.id);

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: tutor.user.id } });
  tutorProfileId = profile!.id;

  // Create another user for authenticated availability queries
  const parent = await createAuthenticatedUser({ role: Role.PARENT });
  otherToken = parent.token;
  userIds.push(parent.user.id);
});

afterAll(async () => {
  for (const id of userIds) await cleanupUser(id);
});

describe('M5: Availability & Scheduling', () => {
  // ==========================================
  // TEMPLATES
  // ==========================================
  describe('Availability Templates', () => {
    let templateId: string;

    it('POST /tutors/availability/templates should create template', async () => {
      const res = await request
        .post(`${API}/tutors/availability/templates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });

      expect(res.status).toBe(201);
      expect(res.body.data.dayOfWeek).toBe(1);
      expect(res.body.data.startTime).toBe('09:00');
      templateId = res.body.data.id;
    });

    it('should reject overlapping template on same day', async () => {
      const res = await request
        .post(`${API}/tutors/availability/templates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ dayOfWeek: 1, startTime: '10:00', endTime: '13:00' });

      expect(res.status).toBe(409);
    });

    it('should allow non-overlapping template on same day', async () => {
      const res = await request
        .post(`${API}/tutors/availability/templates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ dayOfWeek: 1, startTime: '14:00', endTime: '17:00' });

      expect(res.status).toBe(201);
    });

    it('should allow template on different day', async () => {
      const res = await request
        .post(`${API}/tutors/availability/templates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ dayOfWeek: 3, startTime: '09:00', endTime: '12:00' });

      expect(res.status).toBe(201);
    });

    it('GET /tutors/availability/templates should list templates', async () => {
      const res = await request
        .get(`${API}/tutors/availability/templates`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('DELETE /tutors/availability/templates/:id should remove template', async () => {
      const res = await request
        .delete(`${API}/tutors/availability/templates/${templateId}`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject invalid time format', async () => {
      const res = await request
        .post(`${API}/tutors/availability/templates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ dayOfWeek: 5, startTime: '9am', endTime: '12pm' });

      expect(res.status).toBe(400);
    });

    it('should reject startTime >= endTime', async () => {
      const res = await request
        .post(`${API}/tutors/availability/templates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ dayOfWeek: 5, startTime: '14:00', endTime: '12:00' });

      expect(res.status).toBe(400);
    });

    it('should reject dayOfWeek outside 0-6', async () => {
      const res = await request
        .post(`${API}/tutors/availability/templates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ dayOfWeek: 7, startTime: '09:00', endTime: '12:00' });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // BLOCKED DATES
  // ==========================================
  describe('Blocked Dates', () => {
    let blockedDateId: string;

    it('POST /tutors/availability/blocked-dates should block a date', async () => {
      const res = await request
        .post(`${API}/tutors/availability/blocked-dates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ date: '2026-04-14', reason: 'Holiday' });

      expect(res.status).toBe(201);
      expect(res.body.data.reason).toBe('Holiday');
      blockedDateId = res.body.data.id;
    });

    it('should reject duplicate blocked date', async () => {
      const res = await request
        .post(`${API}/tutors/availability/blocked-dates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ date: '2026-04-14' });

      expect(res.status).toBe(409);
    });

    it('GET /tutors/availability/blocked-dates should list blocked dates', async () => {
      const res = await request
        .get(`${API}/tutors/availability/blocked-dates`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('DELETE /tutors/availability/blocked-dates/:id should unblock', async () => {
      const res = await request
        .delete(`${API}/tutors/availability/blocked-dates/${blockedDateId}`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject invalid date format', async () => {
      const res = await request
        .post(`${API}/tutors/availability/blocked-dates`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ date: '14-04-2026' });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // COMPUTE AVAILABILITY
  // ==========================================
  describe('Compute Availability', () => {
    beforeAll(async () => {
      // Clean existing templates for this tutor
      await prisma.availabilityTemplate.deleteMany({ where: { tutorId: tutorProfileId } });
      await prisma.blockedDate.deleteMany({ where: { tutorId: tutorProfileId } });

      // Set up known state: Mon 09:00-12:00, Wed 14:00-17:00
      await prisma.availabilityTemplate.createMany({
        data: [
          { tutorId: tutorProfileId, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
          { tutorId: tutorProfileId, dayOfWeek: 3, startTime: '14:00', endTime: '17:00' },
        ],
      });

      // Block one Monday: 2026-03-23
      await prisma.blockedDate.create({
        data: { tutorId: tutorProfileId, date: new Date('2026-03-23'), reason: 'Sick' },
      });
    });

    it('GET /tutors/:id/availability should compute slots', async () => {
      // 2026-03-16 (Mon) to 2026-03-29 (Sun) = 2 weeks
      const res = await request
        .get(`${API}/tutors/${tutorProfileId}/availability?startDate=2026-03-16&endDate=2026-03-29`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const slots = res.body.data;
      // Expected: Mon Mar 16, Wed Mar 18, Wed Mar 25, Mon Mar 29 (if within range) — Mar 23 (Mon) is blocked
      // Check that blocked Monday is excluded
      const blockedSlot = slots.find((s: { date: string }) => s.date === '2026-03-23');
      expect(blockedSlot).toBeUndefined();

      // Check that non-blocked Monday is included
      const validMonday = slots.find((s: { date: string }) => s.date === '2026-03-16');
      expect(validMonday).toBeDefined();
      expect(validMonday.startTime).toBe('09:00');
    });

    it('should reject date range > 30 days', async () => {
      const res = await request
        .get(`${API}/tutors/${tutorProfileId}/availability?startDate=2026-01-01&endDate=2026-03-01`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(400);
    });

    it('should reject startDate > endDate', async () => {
      const res = await request
        .get(`${API}/tutors/${tutorProfileId}/availability?startDate=2026-03-29&endDate=2026-03-16`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await request
        .get(`${API}/tutors/${tutorProfileId}/availability?startDate=2026-03-16&endDate=2026-03-22`);

      expect(res.status).toBe(401);
    });
  });
});
