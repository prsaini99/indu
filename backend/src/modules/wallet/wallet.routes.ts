import { Router } from 'express';
import { Role, Permission } from '@prisma/client';
import { WalletController } from './wallet.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';
import { validate } from '../../shared/middlewares/validate';
import {
  parentIdParam,
  creditPackageIdParam,
  createCreditPackageSchema,
  updateCreditPackageSchema,
  adjustCreditsSchema,
  walletTransactionQuerySchema,
} from './wallet.validators';

const router = Router();
const controller = new WalletController();

// ==========================================
// PARENT: WALLET
// ==========================================

router.get(
  '/wallet/balance',
  authenticate,
  requireRole(Role.PARENT),
  controller.getBalance
);

router.get(
  '/wallet/transactions',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: walletTransactionQuerySchema }),
  controller.getTransactions
);

// ==========================================
// PUBLIC: CREDIT PACKAGES
// ==========================================

router.get(
  '/credit-packages',
  controller.listActivePackages
);

// ==========================================
// ADMIN: CREDIT PACKAGES
// ==========================================

router.get(
  '/admin/credit-packages',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.CREDIT_MANAGEMENT),
  controller.listAllPackages
);

router.post(
  '/admin/credit-packages',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.CREDIT_MANAGEMENT),
  validate({ body: createCreditPackageSchema }),
  controller.createPackage
);

router.patch(
  '/admin/credit-packages/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.CREDIT_MANAGEMENT),
  validate({ params: creditPackageIdParam, body: updateCreditPackageSchema }),
  controller.updatePackage
);

router.patch(
  '/admin/credit-packages/:id/deactivate',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.CREDIT_MANAGEMENT),
  validate({ params: creditPackageIdParam }),
  controller.deactivatePackage
);

router.delete(
  '/admin/credit-packages/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.CREDIT_MANAGEMENT),
  validate({ params: creditPackageIdParam }),
  controller.softDeletePackage
);

// ==========================================
// ADMIN: WALLETS
// ==========================================

router.get(
  '/admin/wallets',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.CREDIT_MANAGEMENT),
  controller.listAllWallets
);

router.post(
  '/admin/wallets/:parentId/adjust',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.CREDIT_MANAGEMENT),
  validate({ params: parentIdParam, body: adjustCreditsSchema }),
  controller.adjustCredits
);

export default router;
