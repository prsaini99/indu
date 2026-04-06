import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock Stripe at module boundary BEFORE any imports of app/services that pull stripe in.
// vi.mock is hoisted to the top of the file by Vitest.
vi.mock('../config/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

// Also ensure STRIPE_WEBHOOK_SECRET is set so the service doesn't bail early
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_for_mock';

import { Role, Permission } from '@prisma/client';
import prisma from '../config/database';
import { stripe } from '../config/stripe';
import {
  request,
  API,
  createAuthenticatedUser,
  createSuperAdmin,
  cleanupUser,
  cleanupPayments,
  createCreditPackage,
} from './helpers';

const userIds: string[] = [];

let parentToken: string;
let parentUserId: string;
let parentProfileId: string;
let parentEmail: string;
let adminToken: string;
let pkg: { id: string; credits: number; priceInFils: number };

// Track created credit packages for cleanup
const createdPackageIds: string[] = [];

beforeAll(async () => {
  // Create a parent
  const parent = await createAuthenticatedUser({
    role: Role.PARENT,
    firstName: 'Pay',
    lastName: 'Tester',
  });
  parentToken = parent.token;
  parentUserId = parent.user.id;
  parentEmail = parent.email;
  userIds.push(parentUserId);

  const pp = await prisma.parentProfile.findUnique({ where: { userId: parent.user.id } });
  parentProfileId = pp!.id;

  // Create an admin (with PAYMENT_MANAGEMENT permission via SUPER_ADMIN)
  const admin = await createSuperAdmin();
  adminToken = admin.token;
  userIds.push(admin.user.id);

  // Create an active credit package
  pkg = await createCreditPackage({ credits: 100, priceInFils: 10000 });
  createdPackageIds.push(pkg.id);
});

afterAll(async () => {
  if (parentProfileId) await cleanupPayments(parentProfileId);
  for (const id of userIds) await cleanupUser(id);
  // Clean up created credit packages
  for (const id of createdPackageIds) {
    try {
      await prisma.creditPackage.delete({ where: { id } });
    } catch {
      // Ignore if already deleted
    }
  }
});

beforeEach(() => {
  // Reset all mock call records & implementations between tests
  vi.mocked(stripe!.checkout.sessions.create).mockReset();
  vi.mocked(stripe!.webhooks.constructEvent).mockReset();
});

describe('M9: Payment Module', () => {
  // ============================================
  // BLOCK 1: CREATE CHECKOUT SESSION
  // ============================================
  describe('POST /payments/checkout', () => {
    beforeEach(async () => {
      await cleanupPayments(parentProfileId);
    });

    it('should create checkout session and PENDING payment row', async () => {
      // Mock Stripe response
      vi.mocked(stripe!.checkout.sessions.create).mockResolvedValueOnce({
        id: 'cs_test_session_001',
        url: 'https://checkout.stripe.com/pay/cs_test_session_001',
      } as any);

      const res = await request
        .post(`${API}/payments/checkout`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ packageId: pkg.id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_session_001');

      // Verify Payment row created as PENDING
      const payment = await prisma.payment.findUnique({
        where: { stripeSessionId: 'cs_test_session_001' },
      });
      expect(payment).not.toBeNull();
      expect(payment!.status).toBe('PENDING');
      expect(payment!.parentId).toBe(parentProfileId);
      expect(payment!.creditPackageId).toBe(pkg.id);
      expect(payment!.amountInFils).toBe(pkg.priceInFils);
      expect(payment!.credits).toBe(pkg.credits);
      expect(payment!.currency).toBe('aed');
    });

    it('should call Stripe with correct line items and metadata', async () => {
      vi.mocked(stripe!.checkout.sessions.create).mockResolvedValueOnce({
        id: 'cs_test_session_002',
        url: 'https://checkout.stripe.com/pay/cs_test_session_002',
      } as any);

      await request
        .post(`${API}/payments/checkout`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ packageId: pkg.id });

      const callArg = vi.mocked(stripe!.checkout.sessions.create).mock.calls[0][0] as any;
      expect(callArg.mode).toBe('payment');
      expect(callArg.currency).toBe('aed');
      expect(callArg.customer_email).toBe(parentEmail);
      expect(callArg.line_items[0].price_data.currency).toBe('aed');
      expect(callArg.line_items[0].price_data.unit_amount).toBe(pkg.priceInFils);
      expect(callArg.metadata.parentId).toBe(parentProfileId);
      expect(callArg.metadata.packageId).toBe(pkg.id);
      expect(callArg.metadata.credits).toBe(String(pkg.credits));
      expect(callArg.success_url).toContain('payment=success');
      expect(callArg.cancel_url).toContain('payment=cancelled');
    });

    it('should reject when package not found (404)', async () => {
      const res = await request
        .post(`${API}/payments/checkout`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ packageId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(404);
    });

    it('should reject when package is inactive (404)', async () => {
      const inactivePkg = await createCreditPackage({ isActive: false });
      createdPackageIds.push(inactivePkg.id);

      const res = await request
        .post(`${API}/payments/checkout`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ packageId: inactivePkg.id });

      expect(res.status).toBe(404);
    });

    it('should reject when package is soft-deleted (404)', async () => {
      const deletedPkg = await createCreditPackage();
      createdPackageIds.push(deletedPkg.id);
      await prisma.creditPackage.update({
        where: { id: deletedPkg.id },
        data: { deletedAt: new Date() },
      });

      const res = await request
        .post(`${API}/payments/checkout`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ packageId: deletedPkg.id });

      expect(res.status).toBe(404);
    });

    it('should reject missing packageId (validator)', async () => {
      const res = await request
        .post(`${API}/payments/checkout`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // BLOCK 2: WEBHOOK SIGNATURE VERIFICATION
  // ============================================
  describe('POST /payments/webhook — signature verification', () => {
    it('should accept valid signature and process event', async () => {
      // Pre-create a payment row that the webhook will reference
      await cleanupPayments(parentProfileId);
      const payment = await prisma.payment.create({
        data: {
          parentId: parentProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: 'cs_test_sig_valid',
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'PENDING',
        },
      });

      // Mock constructEvent to return a valid event
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_sig_valid', payment_intent: 'pi_test_001' } },
      } as any);

      const res = await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .set('Content-Type', 'application/json')
        .send(Buffer.from('{}'));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      // Verify payment was processed (status COMPLETED)
      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      expect(updated!.status).toBe('COMPLETED');
    });

    it('should still return 200 when signature is invalid (Stripe contract)', async () => {
      vi.mocked(stripe!.webhooks.constructEvent).mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      const res = await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'bad_sig')
        .set('Content-Type', 'application/json')
        .send(Buffer.from('{}'));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    it('should still return 200 when signature header is missing', async () => {
      vi.mocked(stripe!.webhooks.constructEvent).mockImplementationOnce(() => {
        throw new Error('No signature');
      });

      const res = await request
        .post(`${API}/payments/webhook`)
        .set('Content-Type', 'application/json')
        .send(Buffer.from('{}'));

      expect(res.status).toBe(200);
    });
  });

  // ============================================
  // BLOCK 3: WEBHOOK — checkout.session.completed
  // ============================================
  describe('POST /payments/webhook — checkout.session.completed', () => {
    beforeEach(async () => {
      await cleanupPayments(parentProfileId);
    });

    it('should transition payment PENDING → COMPLETED with stripePaymentIntentId', async () => {
      const payment = await prisma.payment.create({
        data: {
          parentId: parentProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: 'cs_completed_001',
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'PENDING',
        },
      });

      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_completed_001', payment_intent: 'pi_completed_001' } },
      } as any);

      await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .send(Buffer.from('{}'));

      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      expect(updated!.status).toBe('COMPLETED');
      expect(updated!.stripePaymentIntentId).toBe('pi_completed_001');
      expect(updated!.completedAt).not.toBeNull();
    });

    it('should create CreditTransaction with type=PURCHASE linked to payment', async () => {
      const payment = await prisma.payment.create({
        data: {
          parentId: parentProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: 'cs_completed_002',
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'PENDING',
        },
      });

      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_completed_002', payment_intent: 'pi_completed_002' } },
      } as any);

      await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .send(Buffer.from('{}'));

      const tx = await prisma.creditTransaction.findUnique({ where: { paymentId: payment.id } });
      expect(tx).not.toBeNull();
      expect(tx!.type).toBe('PURCHASE');
      expect(tx!.amount).toBe(pkg.credits);
      expect(tx!.parentId).toBe(parentProfileId);
    });

    it('should be idempotent — duplicate webhook does not double-credit', async () => {
      const payment = await prisma.payment.create({
        data: {
          parentId: parentProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: 'cs_idempotent_001',
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'PENDING',
        },
      });

      // First webhook
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_idempotent_001', payment_intent: 'pi_idempotent_001' } },
      } as any);
      await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .send(Buffer.from('{}'));

      // Second (duplicate) webhook
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_idempotent_001', payment_intent: 'pi_idempotent_001' } },
      } as any);
      await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .send(Buffer.from('{}'));

      // Verify only one CreditTransaction exists for this payment
      const txs = await prisma.creditTransaction.findMany({ where: { paymentId: payment.id } });
      expect(txs.length).toBe(1);

      // Payment still COMPLETED
      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      expect(updated!.status).toBe('COMPLETED');
    });

    it('should silently ignore unknown sessionId', async () => {
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_unknown_xxx', payment_intent: 'pi_xxx' } },
      } as any);

      const res = await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .send(Buffer.from('{}'));

      expect(res.status).toBe(200);
      // No payment created, no error
      const payment = await prisma.payment.findUnique({ where: { stripeSessionId: 'cs_unknown_xxx' } });
      expect(payment).toBeNull();
    });

    it('should ignore unhandled event types', async () => {
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'some.other.event',
        data: { object: {} },
      } as any);

      const res = await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .send(Buffer.from('{}'));

      expect(res.status).toBe(200);
    });
  });

  // ============================================
  // BLOCK 4: WEBHOOK — checkout.session.expired
  // ============================================
  describe('POST /payments/webhook — checkout.session.expired', () => {
    beforeEach(async () => {
      await cleanupPayments(parentProfileId);
    });

    it('should transition PENDING → EXPIRED', async () => {
      const payment = await prisma.payment.create({
        data: {
          parentId: parentProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: 'cs_expired_001',
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'PENDING',
        },
      });

      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'checkout.session.expired',
        data: { object: { id: 'cs_expired_001' } },
      } as any);

      await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .send(Buffer.from('{}'));

      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      expect(updated!.status).toBe('EXPIRED');
    });

    it('should NOT downgrade COMPLETED → EXPIRED', async () => {
      const payment = await prisma.payment.create({
        data: {
          parentId: parentProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: 'cs_already_completed',
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'checkout.session.expired',
        data: { object: { id: 'cs_already_completed' } },
      } as any);

      await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .send(Buffer.from('{}'));

      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      expect(updated!.status).toBe('COMPLETED');
    });

    it('should silently ignore unknown sessionId', async () => {
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValueOnce({
        type: 'checkout.session.expired',
        data: { object: { id: 'cs_expired_unknown' } },
      } as any);

      const res = await request
        .post(`${API}/payments/webhook`)
        .set('stripe-signature', 'fake_sig')
        .send(Buffer.from('{}'));

      expect(res.status).toBe(200);
    });
  });

  // ============================================
  // BLOCK 5: GET MY PAYMENTS
  // ============================================
  describe('GET /payments/my', () => {
    let otherParentToken: string;
    let otherProfileId: string;

    beforeAll(async () => {
      // Create a second parent for cross-ownership tests
      const other = await createAuthenticatedUser({ role: Role.PARENT });
      otherParentToken = other.token;
      userIds.push(other.user.id);
      const op = await prisma.parentProfile.findUnique({ where: { userId: other.user.id } });
      otherProfileId = op!.id;
    });

    beforeEach(async () => {
      await cleanupPayments(parentProfileId);
      await cleanupPayments(otherProfileId);

      // Seed 2 payments for our parent (one COMPLETED, one PENDING)
      await prisma.payment.create({
        data: {
          parentId: parentProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: `cs_my_completed_${Date.now()}`,
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      await prisma.payment.create({
        data: {
          parentId: parentProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: `cs_my_pending_${Date.now()}`,
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'PENDING',
        },
      });
      // Seed 1 payment for other parent
      await prisma.payment.create({
        data: {
          parentId: otherProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: `cs_other_${Date.now()}`,
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'COMPLETED',
        },
      });
    });

    it('should list parent own payments only', async () => {
      const res = await request
        .get(`${API}/payments/my`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      // Each item has packageName and credits
      expect(res.body.data[0]).toHaveProperty('packageName');
      expect(res.body.data[0]).toHaveProperty('credits');
    });

    it('should filter by status=COMPLETED', async () => {
      const res = await request
        .get(`${API}/payments/my?status=COMPLETED`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((p: any) => p.status === 'COMPLETED')).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should not return other parent payments', async () => {
      const res = await request
        .get(`${API}/payments/my`)
        .set('Authorization', `Bearer ${otherParentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should include pagination meta', async () => {
      const res = await request
        .get(`${API}/payments/my?page=1&limit=10`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
      expect(res.body.meta.total).toBe(2);
    });

    it('should reject non-parent role (403)', async () => {
      const res = await request
        .get(`${API}/payments/my`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 6: ADMIN LIST ALL PAYMENTS
  // ============================================
  describe('GET /admin/payments', () => {
    beforeAll(async () => {
      // Seed at least one payment
      await cleanupPayments(parentProfileId);
      await prisma.payment.create({
        data: {
          parentId: parentProfileId,
          creditPackageId: pkg.id,
          stripeSessionId: `cs_admin_test_${Date.now()}`,
          amountInFils: pkg.priceInFils,
          credits: pkg.credits,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    });

    it('should return all payments for super admin', async () => {
      const res = await request
        .get(`${API}/admin/payments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      // Has parentName/parentEmail (admin view)
      expect(res.body.data[0]).toHaveProperty('parentName');
      expect(res.body.data[0]).toHaveProperty('parentEmail');
    });

    it('should reject parent role (403)', async () => {
      const res = await request
        .get(`${API}/admin/payments`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject admin without PAYMENT_MANAGEMENT permission (403)', async () => {
      // Create an ADMIN role user with NO permissions
      const limited = await createAuthenticatedUser({ role: Role.ADMIN });
      userIds.push(limited.user.id);
      // Wipe any default permissions
      await prisma.adminPermission.deleteMany({ where: { userId: limited.user.id } });

      // Re-issue token with no permissions in payload
      const jwt = await import('jsonwebtoken');
      const { env } = await import('../config/env');
      const noPermToken = jwt.default.sign(
        { sub: limited.user.id, email: limited.email, role: Role.ADMIN, permissions: [] },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request
        .get(`${API}/admin/payments`)
        .set('Authorization', `Bearer ${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });
});
