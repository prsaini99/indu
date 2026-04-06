import { CreditTransactionType } from '@prisma/client';
import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { computeBalance } from '../../shared/utils/credit';
import {
  CreateCreditPackageDTO,
  UpdateCreditPackageDTO,
  AdjustCreditsDTO,
  WalletTransactionQuery,
} from './wallet.types';

export class WalletService {
  // ==========================================
  // HELPERS
  // ==========================================

  private async getParentProfileByUserId(userId: string) {
    const profile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Parent profile not found');
    return profile;
  }


  // ==========================================
  // PARENT: WALLET
  // ==========================================

  async getBalance(userId: string) {
    const profile = await this.getParentProfileByUserId(userId);
    const balance = await computeBalance(profile.id);

    // Also compute totals
    const transactions = await prisma.creditTransaction.findMany({
      where: { parentId: profile.id },
      select: { type: true, amount: true },
    });

    let totalPurchased = 0;
    let totalSpent = 0;
    for (const tx of transactions) {
      if (tx.type === 'PURCHASE' || tx.type === 'ADMIN_ADJUSTMENT') {
        totalPurchased += tx.amount;
      } else if (tx.type === 'DEDUCTION') {
        totalSpent += tx.amount;
      }
    }

    return { balance, totalPurchased, totalSpent };
  }

  async getTransactions(userId: string, query: WalletTransactionQuery) {
    const profile = await this.getParentProfileByUserId(userId);
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { parentId: profile.id };
    if (query.type) {
      where.type = query.type;
    }

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.creditTransaction.count({ where }),
    ]);

    const formatted = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      createdAt: tx.createdAt,
    }));

    return { data: formatted, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // PUBLIC: CREDIT PACKAGES
  // ==========================================

  async listActivePackages() {
    return prisma.creditPackage.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { priceInFils: 'asc' },
      select: {
        id: true,
        name: true,
        credits: true,
        priceInFils: true,
      },
    });
  }

  // ==========================================
  // ADMIN: CREDIT PACKAGES
  // ==========================================

  async listAllPackages() {
    return prisma.creditPackage.findMany({
      where: { deletedAt: null },
      orderBy: { priceInFils: 'asc' },
    });
  }

  async createPackage(data: CreateCreditPackageDTO) {
    const existing = await prisma.creditPackage.findUnique({ where: { name: data.name } });
    if (existing) {
      throw ApiError.conflict('DUPLICATE_ENTRY', 'A package with this name already exists');
    }

    return prisma.creditPackage.create({ data });
  }

  async updatePackage(packageId: string, data: UpdateCreditPackageDTO) {
    const pkg = await prisma.creditPackage.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.deletedAt) throw ApiError.notFound('Credit package not found');

    // If renaming, check uniqueness
    if (data.name && data.name !== pkg.name) {
      const dup = await prisma.creditPackage.findUnique({ where: { name: data.name } });
      if (dup) throw ApiError.conflict('DUPLICATE_ENTRY', 'A package with this name already exists');
    }

    return prisma.creditPackage.update({
      where: { id: packageId },
      data,
    });
  }

  async deactivatePackage(packageId: string) {
    const pkg = await prisma.creditPackage.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.deletedAt) throw ApiError.notFound('Credit package not found');

    await prisma.creditPackage.update({
      where: { id: packageId },
      data: { isActive: false },
    });

    return { message: 'Credit package deactivated' };
  }

  async softDeletePackage(packageId: string) {
    const pkg = await prisma.creditPackage.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.deletedAt) throw ApiError.notFound('Credit package not found');

    await prisma.creditPackage.update({
      where: { id: packageId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Credit package deleted' };
  }

  // ==========================================
  // ADMIN: WALLETS
  // ==========================================

  async listAllWallets(query: { page?: string; limit?: string; search?: string }) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [parents, total] = await Promise.all([
      prisma.parentProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
          creditTransactions: { select: { type: true, amount: true } },
        },
      }),
      prisma.parentProfile.count({ where }),
    ]);

    const formatted = parents.map((p) => {
      let balance = 0;
      for (const tx of p.creditTransactions) {
        if (tx.type === 'DEDUCTION') balance -= tx.amount;
        else balance += tx.amount;
      }

      return {
        id: p.id,
        userId: p.userId,
        email: p.user.email,
        firstName: p.firstName,
        lastName: p.lastName,
        balance,
      };
    });

    return { data: formatted, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // PAYMENT: ADD CREDITS FROM STRIPE PURCHASE
  // ==========================================

  async addCreditsFromPayment(parentId: string, credits: number, description: string, paymentId: string) {
    // Idempotency: check if transaction already exists for this payment
    const existing = await prisma.creditTransaction.findUnique({ where: { paymentId } });
    if (existing) return existing;

    const tx = await prisma.creditTransaction.create({
      data: {
        parentId,
        type: 'PURCHASE',
        amount: credits,
        description,
        paymentId,
      },
    });

    // Auto-resume paused enrollments when credits are added
    try {
      const { EnrollmentService } = await import('../enrollment/enrollment.service');
      const enrollmentService = new EnrollmentService();
      await enrollmentService.checkAndResumePausedEnrollments(parentId);
    } catch (err) {
      console.error('Auto-resume check failed (non-blocking):', err);
    }

    return tx;
  }

  async adjustCredits(parentProfileId: string, data: AdjustCreditsDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { id: parentProfileId } });
    if (!parent) throw ApiError.notFound('Parent not found');

    const type: CreditTransactionType = data.amount > 0 ? 'ADMIN_ADJUSTMENT' : 'DEDUCTION';
    const amount = Math.abs(data.amount);

    // If deducting, check balance
    if (data.amount < 0) {
      const balance = await computeBalance(parentProfileId);
      if (balance < amount) {
        throw ApiError.badRequest('INSUFFICIENT_CREDITS', `Parent only has ${balance} credits. Cannot deduct ${amount}.`);
      }
    }

    const tx = await prisma.creditTransaction.create({
      data: {
        parentId: parentProfileId,
        type,
        amount,
        description: data.description,
      },
    });

    const newBalance = await computeBalance(parentProfileId);

    // Auto-resume paused enrollments when credits are added
    if (data.amount > 0) {
      try {
        const { EnrollmentService } = await import('../enrollment/enrollment.service');
        const enrollmentService = new EnrollmentService();
        await enrollmentService.checkAndResumePausedEnrollments(parentProfileId);
      } catch (err) {
        console.error('Auto-resume check failed (non-blocking):', err);
      }
    }

    return {
      newBalance,
      transaction: { id: tx.id, type: tx.type, amount: tx.amount },
    };
  }
}
