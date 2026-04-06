import { Router } from 'express';
import { applicationController as controller } from './application.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { validate } from '../../shared/middlewares/validate';
import { Role } from '@prisma/client';
import {
  createApplicationSchema,
  reviewApplicationSchema,
  applicationIdParam,
  applicationQuerySchema,
} from './application.validators';

const router = Router();

// ─── Public: Submit application (no auth) ───
router.post(
  '/applications',
  validate({ body: createApplicationSchema }),
  controller.create
);

// ─── Admin: List all applications ───
router.get(
  '/admin/applications',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ query: applicationQuerySchema }),
  controller.listAll
);

// ─── Admin: Get single application ───
router.get(
  '/admin/applications/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: applicationIdParam }),
  controller.getById
);

// ─── Admin: Review (approve/reject) application ───
router.patch(
  '/admin/applications/:id/review',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: applicationIdParam, body: reviewApplicationSchema }),
  controller.review
);

export default router;
