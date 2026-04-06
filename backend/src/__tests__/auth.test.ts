import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../config/database';
import {
  request,
  API,
  uniqueEmail,
  createTestUser,
  createAuthenticatedUser,
  cleanupUser,
} from './helpers';

const userIds: string[] = [];

afterAll(async () => {
  for (const id of userIds) await cleanupUser(id);
});

describe('M1: Auth Module', () => {
  // ==========================================
  // SIGNUP
  // ==========================================
  describe('POST /auth/signup', () => {
    it('should register a new parent', async () => {
      const email = uniqueEmail('signup');
      const res = await request
        .post(`${API}/auth/signup`)
        .send({ email, password: 'StrongPass1!', firstName: 'John', lastName: 'Doe' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Account created');

      // Track for cleanup
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userIds.push(user.id);
    });

    it('should reject duplicate email', async () => {
      const email = uniqueEmail('dup');
      const res1 = await request
        .post(`${API}/auth/signup`)
        .send({ email, password: 'StrongPass1!', firstName: 'Ab', lastName: 'Bc' });
      expect(res1.status).toBe(201);

      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userIds.push(user.id);

      const res2 = await request
        .post(`${API}/auth/signup`)
        .send({ email, password: 'StrongPass1!', firstName: 'Ab', lastName: 'Bc' });
      expect(res2.status).toBe(409);
    });

    it('should reject weak password', async () => {
      const res = await request
        .post(`${API}/auth/signup`)
        .send({ email: uniqueEmail(), password: '123', firstName: 'Ab', lastName: 'Bc' });
      expect(res.status).toBe(400);
    });

    it('should reject missing fields', async () => {
      const res = await request
        .post(`${API}/auth/signup`)
        .send({ email: uniqueEmail() });
      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // LOGIN
  // ==========================================
  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const { email, password, user } = await createTestUser();
      userIds.push(user.id);

      const res = await request
        .post(`${API}/auth/login`)
        .send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.id).toBe(user.id);
      expect(res.body.data.user.role).toBe('PARENT');
    });

    it('should reject wrong password', async () => {
      const { email, user } = await createTestUser();
      userIds.push(user.id);

      const res = await request
        .post(`${API}/auth/login`)
        .send({ email, password: 'WrongPass1!' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request
        .post(`${API}/auth/login`)
        .send({ email: 'nobody@nowhere.com', password: 'Test1234!' });

      expect(res.status).toBe(401);
    });

    it('should reject disabled account', async () => {
      const { email, password, user } = await createTestUser({ isActive: false });
      userIds.push(user.id);

      const res = await request
        .post(`${API}/auth/login`)
        .send({ email, password });

      expect(res.status).toBe(403);
    });

    it('should set refresh token cookie', async () => {
      const { email, password, user } = await createTestUser();
      userIds.push(user.id);

      const res = await request
        .post(`${API}/auth/login`)
        .send({ email, password });

      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
  });

  // ==========================================
  // LOGOUT
  // ==========================================
  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const { token, user } = await createAuthenticatedUser();
      userIds.push(user.id);

      const res = await request
        .post(`${API}/auth/logout`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('Logged out');
    });

    it('should reject unauthenticated logout', async () => {
      const res = await request.post(`${API}/auth/logout`);
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // FORGOT / RESET PASSWORD
  // ==========================================
  describe('Password Reset Flow', () => {
    it('should accept forgot-password for existing email', async () => {
      const { email, user } = await createTestUser();
      userIds.push(user.id);

      const res = await request
        .post(`${API}/auth/forgot-password`)
        .send({ email });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('reset link');
    });

    it('should not reveal if email does not exist', async () => {
      const res = await request
        .post(`${API}/auth/forgot-password`)
        .send({ email: 'ghost@nowhere.com' });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('reset link');
    });

    it('should reset password with valid token', async () => {
      const { email, user } = await createTestUser();
      userIds.push(user.id);

      // Trigger forgot password
      await request.post(`${API}/auth/forgot-password`).send({ email });

      // Get the token from DB
      const tokenRecord = await prisma.token.findFirst({
        where: { userId: user.id, type: 'PASSWORD_RESET' },
      });
      expect(tokenRecord).toBeTruthy();

      const res = await request
        .post(`${API}/auth/reset-password`)
        .send({ token: tokenRecord!.value, newPassword: 'NewPass123!' });

      expect(res.status).toBe(200);

      // Should be able to login with new password
      const loginRes = await request
        .post(`${API}/auth/login`)
        .send({ email, password: 'NewPass123!' });
      expect(loginRes.status).toBe(200);
    });

    it('should reject invalid reset token', async () => {
      const res = await request
        .post(`${API}/auth/reset-password`)
        .send({ token: 'invalid-token', newPassword: 'NewPass123!' });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================
  describe('POST /auth/change-password', () => {
    it('should change password with correct current password', async () => {
      const { token, password, user } = await createAuthenticatedUser();
      userIds.push(user.id);

      const res = await request
        .post(`${API}/auth/change-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: password, newPassword: 'Changed123!' });

      expect(res.status).toBe(200);
    });

    it('should reject wrong current password', async () => {
      const { token, user } = await createAuthenticatedUser();
      userIds.push(user.id);

      const res = await request
        .post(`${API}/auth/change-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'WrongOld1!', newPassword: 'Changed123!' });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // VERIFY EMAIL
  // ==========================================
  describe('GET /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const { user } = await createTestUser({ isEmailVerified: false });
      userIds.push(user.id);

      // Create a verification token
      const tokenRecord = await prisma.token.create({
        data: {
          userId: user.id,
          type: 'EMAIL_VERIFICATION',
          value: 'test-verify-token-' + user.id,
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const res = await request
        .get(`${API}/auth/verify-email?token=${tokenRecord.value}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('verified');
    });

    it('should reject invalid verification token', async () => {
      const res = await request
        .get(`${API}/auth/verify-email?token=invalid`);

      expect(res.status).toBe(400);
    });
  });
});
