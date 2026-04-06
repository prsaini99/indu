import { Router } from 'express';
import { Role, Permission } from '@prisma/client';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';
import { validate } from '../../shared/middlewares/validate';
import { createCheckoutSchema, paymentQuerySchema } from './payment.validators';

const router = Router();
const controller = new PaymentController();

// ==========================================
// PARENT: PAYMENTS
// ==========================================

router.post(
  '/payments/checkout',
  authenticate,
  requireRole(Role.PARENT),
  validate({ body: createCheckoutSchema }),
  controller.createCheckout
);

router.get(
  '/payments/my',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: paymentQuerySchema }),
  controller.getMyPayments
);

// ==========================================
// WEBHOOK (no auth — verified by Stripe signature)
// Note: raw body middleware is applied in app.ts
// ==========================================

router.post(
  '/payments/webhook',
  controller.handleWebhook
);

// ==========================================
// ADMIN: PAYMENTS
// ==========================================

router.get(
  '/admin/payments',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.PAYMENT_MANAGEMENT),
  validate({ query: paymentQuerySchema }),
  controller.listAllPayments
);

export default router;
