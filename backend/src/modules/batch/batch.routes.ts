import { Router } from 'express';
import { Role } from '@prisma/client';
import { BatchController } from './batch.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { validate } from '../../shared/middlewares/validate';
import {
  createBatchSchema,
  updateBatchSchema,
  joinBatchSchema,
  batchIdParam,
  studentIdParam,
  batchQuerySchema,
  cancelReasonSchema,
} from './batch.validators';

const router = Router();
const controller = new BatchController();

// ==========================================
// ADMIN: BATCH MANAGEMENT
// ==========================================

router.post(
  '/admin/batches',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  validate({ body: createBatchSchema }),
  controller.create
);

router.get(
  '/admin/batches',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  validate({ query: batchQuerySchema }),
  controller.listAll
);

router.get(
  '/admin/batches/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  validate({ params: batchIdParam }),
  controller.getById
);

router.patch(
  '/admin/batches/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  validate({ params: batchIdParam, body: updateBatchSchema }),
  controller.update
);

router.patch(
  '/admin/batches/:id/start',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  validate({ params: batchIdParam }),
  controller.startBatch
);

router.patch(
  '/admin/batches/:id/cancel',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  validate({ params: batchIdParam, body: cancelReasonSchema }),
  controller.cancelBatch
);

router.delete(
  '/admin/batches/:id/students/:studentId',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  validate({ params: studentIdParam }),
  controller.removeStudent
);

// ==========================================
// PARENT: BATCH BROWSING & JOINING
// ==========================================

router.get(
  '/batches/available',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: batchQuerySchema }),
  controller.listAvailable
);

router.get(
  '/batches/my',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: batchQuerySchema }),
  controller.listMyBatches
);

// TUTOR routes MUST come before /batches/:id to avoid "tutor" being matched as :id
router.get(
  '/batches/tutor',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ query: batchQuerySchema }),
  controller.listForTutor
);

router.get(
  '/batches/tutor/:id',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: batchIdParam }),
  controller.getTutorBatchDetail
);

router.get(
  '/batches/:id/materials',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: batchIdParam }),
  controller.getCourseMaterials
);

router.get(
  '/batches/:id',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: batchIdParam }),
  controller.getBatchDetail
);

router.post(
  '/batches/:id/join',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: batchIdParam, body: joinBatchSchema }),
  controller.joinBatch
);

router.post(
  '/batches/:id/leave',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: batchIdParam, body: joinBatchSchema }),
  controller.leaveBatch
);

export default router;
