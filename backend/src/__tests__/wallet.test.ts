import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import {
  request,
  API,
  createAuthenticatedUser,
  createSuperAdmin,
  cleanupUser,
  cleanupPayments,
  createCreditPackage,
  addCredits,
} from './helpers';

const userIds: string[] = [];
const createdPackageIds: string[] = [];

let parentToken: string;
let parentUserId: string;
let parentProfileId: string;

let otherParentToken: string;
let otherParentProfileId: string;

let adminToken: string;

beforeAll(async () => {
  // Create primary parent
  const parent = await createAuthenticatedUser({
    role: Role.PARENT,
    firstName: 'Wallet',
    lastName: 'Tester',
  });
  parentToken = parent.token;
  parentUserId = parent.user.id;
  userIds.push(parentUserId);
  const pp = await prisma.parentProfile.findUnique({ where: { userId: parent.user.id } });
  parentProfileId = pp!.id;

  // Create second parent (for ownership/search tests)
  const otherParent = await createAuthenticatedUser({
    role: Role.PARENT,
    firstName: 'Other',
    lastName: 'Parent',
  });
  otherParentToken = otherParent.token;
  userIds.push(otherParent.user.id);
  const op = await prisma.parentProfile.findUnique({ where: { userId: otherParent.user.id } });
  otherParentProfileId = op!.id;

  // Create admin (SUPER_ADMIN has all permissions including CREDIT_MANAGEMENT)
  const admin = await createSuperAdmin();
  adminToken = admin.token;
  userIds.push(admin.user.id);
});

afterAll(async () => {
  // Clean transactions + payments for both parents before deleting users
  if (parentProfileId) {
    await cleanupPayments(parentProfileId);
    await prisma.creditTransaction.deleteMany({ where: { parentId: parentProfileId } });
  }
  if (otherParentProfileId) {
    await cleanupPayments(otherParentProfileId);
    await prisma.creditTransaction.deleteMany({ where: { parentId: otherParentProfileId } });
  }
  for (const id of userIds) await cleanupUser(id);

  // Clean up credit packages created during tests
  for (const id of createdPackageIds) {
    try {
      await prisma.creditPackage.delete({ where: { id } });
    } catch {
      // Ignore if already deleted
    }
  }
});

describe('M9 Wallet: Wallet + Credit Packages', () => {
  // ============================================
  // BLOCK 1: GET /wallet/balance
  // ============================================
  describe('GET /wallet/balance', () => {
    beforeEach(async () => {
      await prisma.creditTransaction.deleteMany({ where: { parentId: parentProfileId } });
    });

    it('should return zero balance when no transactions exist', async () => {
      const res = await request
        .get(`${API}/wallet/balance`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.balance).toBe(0);
      expect(res.body.data.totalPurchased).toBe(0);
      expect(res.body.data.totalSpent).toBe(0);
    });

    it('should compute balance with mixed transaction types', async () => {
      // Purchase 100 + Admin adjust 50 - Deduction 30 = 120
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'PURCHASE', amount: 100, description: 'Test purchase' },
      });
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'ADMIN_ADJUSTMENT', amount: 50, description: 'Bonus' },
      });
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'DEDUCTION', amount: 30, description: 'Class session' },
      });

      const res = await request
        .get(`${API}/wallet/balance`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.balance).toBe(120);
    });

    it('should track totalPurchased separately from totalSpent', async () => {
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'PURCHASE', amount: 200, description: 'Big purchase' },
      });
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'ADMIN_ADJUSTMENT', amount: 50, description: 'Admin bonus' },
      });
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'DEDUCTION', amount: 75, description: 'Sessions used' },
      });

      const res = await request
        .get(`${API}/wallet/balance`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalPurchased).toBe(250); // 200 + 50
      expect(res.body.data.totalSpent).toBe(75);
      expect(res.body.data.balance).toBe(175); // 250 - 75
    });

    it('should handle negative balance (deductions exceed credits — edge case)', async () => {
      // This shouldn't happen in practice but the formula should still work
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'PURCHASE', amount: 10, description: 'Small' },
      });
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'DEDUCTION', amount: 50, description: 'Over' },
      });

      const res = await request
        .get(`${API}/wallet/balance`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.balance).toBe(-40);
    });

    it('should reject non-parent role (403)', async () => {
      const res = await request
        .get(`${API}/wallet/balance`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 2: GET /wallet/transactions
  // ============================================
  describe('GET /wallet/transactions', () => {
    beforeEach(async () => {
      await prisma.creditTransaction.deleteMany({ where: { parentId: parentProfileId } });
      await prisma.creditTransaction.deleteMany({ where: { parentId: otherParentProfileId } });

      // Seed 3 transactions for primary parent
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'PURCHASE', amount: 100, description: 'First purchase' },
      });
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'DEDUCTION', amount: 25, description: 'Class 1' },
      });
      await prisma.creditTransaction.create({
        data: { parentId: parentProfileId, type: 'ADMIN_ADJUSTMENT', amount: 10, description: 'Bonus' },
      });

      // Seed 1 transaction for other parent (should NOT appear in primary's list)
      await prisma.creditTransaction.create({
        data: { parentId: otherParentProfileId, type: 'PURCHASE', amount: 500, description: 'Other parent' },
      });
    });

    it('should list own transactions with pagination meta', async () => {
      const res = await request
        .get(`${API}/wallet/transactions`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.meta.total).toBe(3);
    });

    it('should filter by type=PURCHASE', async () => {
      const res = await request
        .get(`${API}/wallet/transactions?type=PURCHASE`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('PURCHASE');
    });

    it('should NOT show other parent transactions (isolation)', async () => {
      const res = await request
        .get(`${API}/wallet/transactions`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      // Should find "First purchase" but not "Other parent"
      const descriptions = res.body.data.map((t: { description: string }) => t.description);
      expect(descriptions).toContain('First purchase');
      expect(descriptions).not.toContain('Other parent');
    });

    it('should order by createdAt desc (newest first)', async () => {
      const res = await request
        .get(`${API}/wallet/transactions`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      const dates = res.body.data.map((t: { createdAt: string }) => new Date(t.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should reject non-parent role (403)', async () => {
      const res = await request
        .get(`${API}/wallet/transactions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 3: GET /credit-packages (public)
  // ============================================
  describe('GET /credit-packages (public)', () => {
    let activePkgId: string;
    let inactivePkgId: string;
    let deletedPkgId: string;

    beforeAll(async () => {
      const active = await createCreditPackage({ credits: 50, priceInFils: 5000 });
      activePkgId = active.id;
      createdPackageIds.push(activePkgId);

      const inactive = await createCreditPackage({ credits: 100, priceInFils: 10000, isActive: false });
      inactivePkgId = inactive.id;
      createdPackageIds.push(inactivePkgId);

      const deleted = await createCreditPackage({ credits: 200, priceInFils: 20000 });
      deletedPkgId = deleted.id;
      createdPackageIds.push(deletedPkgId);
      await prisma.creditPackage.update({
        where: { id: deletedPkgId },
        data: { deletedAt: new Date(), isActive: false },
      });
    });

    it('should return only active, non-deleted packages (no auth required)', async () => {
      const res = await request.get(`${API}/credit-packages`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((p: { id: string }) => p.id);
      expect(ids).toContain(activePkgId);
      expect(ids).not.toContain(inactivePkgId);
      expect(ids).not.toContain(deletedPkgId);
    });

    it('should be sorted by priceInFils ascending', async () => {
      // Create two additional active packages with known prices
      const cheap = await createCreditPackage({ credits: 10, priceInFils: 1000 });
      createdPackageIds.push(cheap.id);
      const expensive = await createCreditPackage({ credits: 500, priceInFils: 50000 });
      createdPackageIds.push(expensive.id);

      const res = await request.get(`${API}/credit-packages`);

      expect(res.status).toBe(200);
      const prices = res.body.data.map((p: { priceInFils: number }) => p.priceInFils);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
      }
    });

    it('should return minimal fields only (id, name, credits, priceInFils)', async () => {
      const res = await request.get(`${API}/credit-packages`);

      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        const pkg = res.body.data[0];
        expect(pkg).toHaveProperty('id');
        expect(pkg).toHaveProperty('name');
        expect(pkg).toHaveProperty('credits');
        expect(pkg).toHaveProperty('priceInFils');
        // Should NOT expose isActive, deletedAt, sortOrder to public
        expect(pkg).not.toHaveProperty('isActive');
        expect(pkg).not.toHaveProperty('deletedAt');
      }
    });
  });

  // ============================================
  // BLOCK 4: GET /admin/credit-packages
  // ============================================
  describe('GET /admin/credit-packages', () => {
    let activePkgId: string;
    let inactivePkgId: string;

    beforeAll(async () => {
      const active = await createCreditPackage({ credits: 75, priceInFils: 7500 });
      activePkgId = active.id;
      createdPackageIds.push(activePkgId);

      const inactive = await createCreditPackage({ credits: 150, priceInFils: 15000, isActive: false });
      inactivePkgId = inactive.id;
      createdPackageIds.push(inactivePkgId);
    });

    it('should return all non-deleted packages (both active and inactive)', async () => {
      const res = await request
        .get(`${API}/admin/credit-packages`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((p: { id: string }) => p.id);
      expect(ids).toContain(activePkgId);
      expect(ids).toContain(inactivePkgId);
    });

    it('should expose full package fields to admin', async () => {
      const res = await request
        .get(`${API}/admin/credit-packages`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const pkg = res.body.data.find((p: { id: string }) => p.id === activePkgId);
      expect(pkg).toHaveProperty('isActive');
      expect(pkg).toHaveProperty('sortOrder');
    });

    it('should reject non-admin (403)', async () => {
      const res = await request
        .get(`${API}/admin/credit-packages`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 5: POST /admin/credit-packages
  // ============================================
  describe('POST /admin/credit-packages', () => {
    it('should create a package with valid data', async () => {
      const uniqueName = `Test Create ${Date.now()}`;
      const res = await request
        .post(`${API}/admin/credit-packages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: uniqueName,
          credits: 100,
          priceInFils: 10000,
          sortOrder: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(uniqueName);
      expect(res.body.data.credits).toBe(100);
      expect(res.body.data.priceInFils).toBe(10000);
      createdPackageIds.push(res.body.data.id);
    });

    it('should reject duplicate name with 409 DUPLICATE_ENTRY', async () => {
      const name = `Duplicate ${Date.now()}`;
      // First create
      const first = await request
        .post(`${API}/admin/credit-packages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, credits: 50, priceInFils: 5000 });
      expect(first.status).toBe(201);
      createdPackageIds.push(first.body.data.id);

      // Duplicate
      const dup = await request
        .post(`${API}/admin/credit-packages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, credits: 200, priceInFils: 20000 });

      expect(dup.status).toBe(409);
      expect(dup.body.error.code).toBe('DUPLICATE_ENTRY');
    });

    it('should reject missing required fields (validator)', async () => {
      const res = await request
        .post(`${API}/admin/credit-packages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Incomplete' }); // missing credits, priceInFils

      expect(res.status).toBe(400);
    });

    it('should reject zero or negative credits (validator)', async () => {
      const res = await request
        .post(`${API}/admin/credit-packages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Negative ${Date.now()}`,
          credits: 0,
          priceInFils: 5000,
        });

      expect(res.status).toBe(400);
    });

    it('should reject non-admin role (403)', async () => {
      const res = await request
        .post(`${API}/admin/credit-packages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          name: `ParentTry ${Date.now()}`,
          credits: 100,
          priceInFils: 10000,
        });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 6: PATCH /admin/credit-packages/:id
  // ============================================
  describe('PATCH /admin/credit-packages/:id', () => {
    let pkgId: string;

    beforeEach(async () => {
      const pkg = await createCreditPackage({ credits: 100, priceInFils: 10000 });
      pkgId = pkg.id;
      createdPackageIds.push(pkgId);
    });

    it('should update package fields', async () => {
      const res = await request
        .patch(`${API}/admin/credit-packages/${pkgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ credits: 150, priceInFils: 12000 });

      expect(res.status).toBe(200);
      expect(res.body.data.credits).toBe(150);
      expect(res.body.data.priceInFils).toBe(12000);
    });

    it('should allow partial update (just name)', async () => {
      const newName = `Renamed ${Date.now()}`;
      const res = await request
        .patch(`${API}/admin/credit-packages/${pkgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: newName });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(newName);
      expect(res.body.data.credits).toBe(100); // unchanged
    });

    it('should reject rename to existing name (409)', async () => {
      const other = await createCreditPackage({ credits: 200, priceInFils: 20000 });
      createdPackageIds.push(other.id);

      const res = await request
        .patch(`${API}/admin/credit-packages/${pkgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: other.name });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_ENTRY');
    });

    it('should 404 on nonexistent package', async () => {
      const res = await request
        .patch(`${API}/admin/credit-packages/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ credits: 99 });

      expect(res.status).toBe(404);
    });

    it('should 404 on soft-deleted package', async () => {
      await prisma.creditPackage.update({
        where: { id: pkgId },
        data: { deletedAt: new Date() },
      });

      const res = await request
        .patch(`${API}/admin/credit-packages/${pkgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ credits: 99 });

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // BLOCK 7: PATCH /admin/credit-packages/:id/deactivate
  // ============================================
  describe('PATCH /admin/credit-packages/:id/deactivate', () => {
    it('should deactivate an active package', async () => {
      const pkg = await createCreditPackage({ isActive: true });
      createdPackageIds.push(pkg.id);

      const res = await request
        .patch(`${API}/admin/credit-packages/${pkg.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);

      const updated = await prisma.creditPackage.findUnique({ where: { id: pkg.id } });
      expect(updated!.isActive).toBe(false);
    });

    it('should 404 on nonexistent package', async () => {
      const res = await request
        .patch(`${API}/admin/credit-packages/00000000-0000-0000-0000-000000000000/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it('should 404 on soft-deleted package', async () => {
      const pkg = await createCreditPackage();
      createdPackageIds.push(pkg.id);
      await prisma.creditPackage.update({ where: { id: pkg.id }, data: { deletedAt: new Date() } });

      const res = await request
        .patch(`${API}/admin/credit-packages/${pkg.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // BLOCK 8: DELETE /admin/credit-packages/:id
  // ============================================
  describe('DELETE /admin/credit-packages/:id', () => {
    it('should soft-delete a package', async () => {
      const pkg = await createCreditPackage();
      createdPackageIds.push(pkg.id);

      const res = await request
        .delete(`${API}/admin/credit-packages/${pkg.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const updated = await prisma.creditPackage.findUnique({ where: { id: pkg.id } });
      expect(updated!.deletedAt).not.toBeNull();
      expect(updated!.isActive).toBe(false);
    });

    it('should 404 on nonexistent package', async () => {
      const res = await request
        .delete(`${API}/admin/credit-packages/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should 404 on already-deleted package', async () => {
      const pkg = await createCreditPackage();
      createdPackageIds.push(pkg.id);
      await prisma.creditPackage.update({ where: { id: pkg.id }, data: { deletedAt: new Date() } });

      const res = await request
        .delete(`${API}/admin/credit-packages/${pkg.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // BLOCK 9: GET /admin/wallets
  // ============================================
  describe('GET /admin/wallets', () => {
    beforeAll(async () => {
      // Give primary parent some credits so balance != 0
      await addCredits(parentProfileId, 500);
    });

    it('should return paginated list of all parent wallets with balance', async () => {
      const res = await request
        .get(`${API}/admin/wallets`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();

      // At least our 2 test parents should be in there
      const ids = res.body.data.map((w: { id: string }) => w.id);
      expect(ids.length).toBeGreaterThanOrEqual(2);

      // Every entry should have a balance field
      for (const w of res.body.data) {
        expect(w).toHaveProperty('balance');
        expect(w).toHaveProperty('email');
      }
    });

    it('should filter by search (firstName/lastName/email)', async () => {
      const res = await request
        .get(`${API}/admin/wallets?search=Wallet`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // Our primary parent has firstName "Wallet"
      const found = res.body.data.find((w: { firstName: string }) => w.firstName === 'Wallet');
      expect(found).toBeDefined();
      expect(found.balance).toBeGreaterThanOrEqual(500);
    });

    it('should reject non-admin (403)', async () => {
      const res = await request
        .get(`${API}/admin/wallets`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // BLOCK 10: POST /admin/wallets/:parentId/adjust
  // ============================================
  describe('POST /admin/wallets/:parentId/adjust', () => {
    beforeEach(async () => {
      // Reset balance — seed with 100 credits
      await prisma.creditTransaction.deleteMany({ where: { parentId: parentProfileId } });
      await addCredits(parentProfileId, 100);
    });

    it('should add credits (positive amount) as ADMIN_ADJUSTMENT', async () => {
      const res = await request
        .post(`${API}/admin/wallets/${parentProfileId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 50, description: 'Bonus credits' });

      expect(res.status).toBe(200);
      expect(res.body.data.newBalance).toBe(150);
      expect(res.body.data.transaction.type).toBe('ADMIN_ADJUSTMENT');
      expect(res.body.data.transaction.amount).toBe(50);
    });

    it('should deduct credits (negative amount) as DEDUCTION', async () => {
      const res = await request
        .post(`${API}/admin/wallets/${parentProfileId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: -30, description: 'Manual deduction' });

      expect(res.status).toBe(200);
      expect(res.body.data.newBalance).toBe(70);
      expect(res.body.data.transaction.type).toBe('DEDUCTION');
      expect(res.body.data.transaction.amount).toBe(30); // stored as positive
    });

    it('should reject deduction larger than balance (INSUFFICIENT_CREDITS)', async () => {
      const res = await request
        .post(`${API}/admin/wallets/${parentProfileId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: -500, description: 'Too much' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('should 404 on nonexistent parent', async () => {
      const res = await request
        .post(`${API}/admin/wallets/00000000-0000-0000-0000-000000000000/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 50, description: 'Test' });

      expect(res.status).toBe(404);
    });

    it('should reject zero amount (validator)', async () => {
      const res = await request
        .post(`${API}/admin/wallets/${parentProfileId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 0, description: 'Zero' });

      expect(res.status).toBe(400);
    });

    it('should reject non-admin role (403)', async () => {
      const res = await request
        .post(`${API}/admin/wallets/${parentProfileId}/adjust`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ amount: 50, description: 'Parent try' });

      expect(res.status).toBe(403);
    });
  });
});
