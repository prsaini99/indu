import { Router } from 'express';
import { DemoBookingController } from './demo-booking.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { validate } from '../../shared/middlewares/validate';
import { Role } from '@prisma/client';
import {
  createDemoBookingSchema,
  updateDemoBookingSchema,
  updateDemoBookingStatusSchema,
  demoBookingIdParam,
  demoBookingQuerySchema,
} from './demo-booking.validators';

const router = Router();
const controller = new DemoBookingController();

// ==========================================
// CONSULTANT ROUTES
// ==========================================

router.post(
  '/demo-bookings',
  authenticate,
  requireRole(Role.CONSULTANT),
  validate({ body: createDemoBookingSchema }),
  controller.create
);

router.get(
  '/demo-bookings/consultant',
  authenticate,
  requireRole(Role.CONSULTANT),
  validate({ query: demoBookingQuerySchema }),
  controller.listForConsultant
);

router.patch(
  '/demo-bookings/:id',
  authenticate,
  requireRole(Role.CONSULTANT),
  validate({ params: demoBookingIdParam, body: updateDemoBookingSchema }),
  controller.update
);

router.patch(
  '/demo-bookings/:id/status',
  authenticate,
  requireRole(Role.CONSULTANT, Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: demoBookingIdParam, body: updateDemoBookingStatusSchema }),
  controller.updateStatus
);

// ==========================================
// TUTOR ROUTE
// ==========================================

router.get(
  '/demo-bookings/tutor',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ query: demoBookingQuerySchema }),
  controller.listForTutor
);

// ==========================================
// PARENT ROUTE
// ==========================================

router.get(
  '/demo-bookings/my',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: demoBookingQuerySchema }),
  controller.listForParent
);

// ==========================================
// ADMIN ROUTE
// ==========================================

router.get(
  '/demo-bookings/admin',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ query: demoBookingQuerySchema }),
  controller.listAll
);

// ==========================================
// SHARED (must be last — :id param)
// ==========================================

router.get(
  '/demo-bookings/:id',
  authenticate,
  validate({ params: demoBookingIdParam }),
  controller.getById
);

export default router;
