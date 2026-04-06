import { Router } from 'express';
import { DemoRequestController } from './demo-request.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';
import { validate } from '../../shared/middlewares/validate';
import { Role, Permission } from '@prisma/client';
import {
  createDemoRequestSchema,
  publicCreateDemoRequestSchema,
  updateStatusSchema,
  demoRequestIdParam,
  demoRequestQuerySchema,
} from './demo-request.validators';

const router = Router();
const controller = new DemoRequestController();

// ==========================================
// PUBLIC ROUTE (no auth)
// ==========================================

// POST /demo-requests/public — Public demo form (no account needed)
router.post(
  '/demo-requests/public',
  validate({ body: publicCreateDemoRequestSchema }),
  controller.createPublic
);

// ==========================================
// PARENT ROUTES
// ==========================================

// POST /demo-requests — Submit a demo request (authenticated parent)
router.post(
  '/demo-requests',
  authenticate,
  requireRole(Role.PARENT),
  validate({ body: createDemoRequestSchema }),
  controller.create
);

// GET /demo-requests/my — List parent's own requests
router.get(
  '/demo-requests/my',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: demoRequestQuerySchema }),
  controller.listMine
);

// DELETE /demo-requests/:id/cancel — Cancel own request
router.delete(
  '/demo-requests/:id/cancel',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: demoRequestIdParam }),
  controller.cancel
);

// ==========================================
// CONSULTANT ROUTES
// ==========================================

// GET /demo-requests/consultant — List for consultant
router.get(
  '/demo-requests/consultant',
  authenticate,
  requireRole(Role.CONSULTANT),
  validate({ query: demoRequestQuerySchema }),
  controller.listForConsultant
);

// PATCH /demo-requests/:id/assign — Self-assign
router.patch(
  '/demo-requests/:id/assign',
  authenticate,
  requireRole(Role.CONSULTANT),
  validate({ params: demoRequestIdParam }),
  controller.assignToMe
);

// PATCH /demo-requests/:id/status — Update status (consultant or admin)
router.patch(
  '/demo-requests/:id/status',
  authenticate,
  requireRole(Role.CONSULTANT, Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: demoRequestIdParam, body: updateStatusSchema }),
  controller.updateStatus
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// GET /demo-requests/admin — List all (admin oversight)
router.get(
  '/demo-requests/admin',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ query: demoRequestQuerySchema }),
  controller.listAll
);

// ==========================================
// SHARED ROUTE (must be last — :id param)
// ==========================================

// GET /demo-requests/:id — View single request (access-controlled)
router.get(
  '/demo-requests/:id',
  authenticate,
  validate({ params: demoRequestIdParam }),
  controller.getById
);

export default router;
