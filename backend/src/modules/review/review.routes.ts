import { Router } from 'express';
import { Role, Permission } from '@prisma/client';
import { ReviewController } from './review.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';
import { validate } from '../../shared/middlewares/validate';
import {
  createReviewSchema,
  reviewQuerySchema,
  adminReviewQuerySchema,
  tutorIdParam,
  reviewIdParam,
  updateVisibilitySchema,
  tutorReviewsQuerySchema,
} from './review.validators';

const router = Router();
const controller = new ReviewController();

// ==========================================
// PARENT: REVIEWS
// ==========================================

router.post(
  '/reviews',
  authenticate,
  requireRole(Role.PARENT),
  validate({ body: createReviewSchema }),
  controller.create
);

router.get(
  '/reviews/my-reviews',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: reviewQuerySchema }),
  controller.listByParent
);

// ==========================================
// TUTOR: OWN REVIEWS (must come BEFORE /tutors/:id/reviews)
// ==========================================

router.get(
  '/tutors/reviews',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ query: reviewQuerySchema }),
  controller.listForOwnTutor
);

// ==========================================
// PUBLIC: TUTOR REVIEWS
// ==========================================

router.get(
  '/tutors/:id/reviews',
  validate({ params: tutorIdParam, query: tutorReviewsQuerySchema }),
  controller.listByTutor
);

// ==========================================
// ADMIN: REVIEWS
// ==========================================

router.get(
  '/admin/reviews',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ query: adminReviewQuerySchema }),
  controller.listAll
);

router.patch(
  '/admin/reviews/:id/visibility',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ params: reviewIdParam, body: updateVisibilitySchema }),
  controller.updateVisibility
);

export default router;
