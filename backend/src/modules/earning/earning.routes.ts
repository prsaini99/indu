import { Router } from 'express';
import { Role, Permission } from '@prisma/client';
import { EarningController } from './earning.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';
import { validate } from '../../shared/middlewares/validate';
import {
  earningQuerySchema,
  adminEarningQuerySchema,
  createPayoutSchema,
  payoutQuerySchema,
} from './earning.validators';

const router = Router();
const controller = new EarningController();

// ==========================================
// TUTOR: EARNINGS
// ==========================================

router.get(
  '/tutors/earnings/summary',
  authenticate,
  requireRole(Role.TUTOR),
  controller.getSummaryForTutor
);

router.get(
  '/tutors/earnings',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ query: earningQuerySchema }),
  controller.listForTutor
);

// ==========================================
// ADMIN: EARNINGS
// ==========================================

router.get(
  '/admin/earnings/summary',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_PAYOUTS),
  controller.getAdminSummary
);

router.get(
  '/admin/earnings/export',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_PAYOUTS),
  validate({ query: adminEarningQuerySchema }),
  controller.exportCsv
);

router.get(
  '/admin/earnings',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_PAYOUTS),
  validate({ query: adminEarningQuerySchema }),
  controller.listAll
);

// ==========================================
// ADMIN: PAYOUTS
// ==========================================

router.post(
  '/admin/payouts',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_PAYOUTS),
  validate({ body: createPayoutSchema }),
  controller.createPayout
);

router.get(
  '/admin/payouts',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_PAYOUTS),
  validate({ query: payoutQuerySchema }),
  controller.listPayouts
);

export default router;
