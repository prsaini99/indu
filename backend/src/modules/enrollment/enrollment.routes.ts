import { Router } from 'express';
import { EnrollmentController } from './enrollment.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { validate } from '../../shared/middlewares/validate';
import { Role } from '@prisma/client';
import {
  createEnrollmentSchema,
  enrollmentIdParam,
  sessionIdParam,
  enrollmentQuerySchema,
  sessionQuerySchema,
  cancelSessionSchema,
  reassignTutorSchema,
  reviewNoShowSchema,
  availableSlotsQuerySchema,
  updateMeetingLinkSchema,
} from './enrollment.validators';

const router = Router();
const controller = new EnrollmentController();

// ==========================================
// PARENT ROUTES
// ==========================================

router.get(
  '/enrollments/available-slots',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: availableSlotsQuerySchema }),
  controller.getAvailableSlots
);

router.post(
  '/enrollments',
  authenticate,
  requireRole(Role.PARENT),
  validate({ body: createEnrollmentSchema }),
  controller.create
);

router.get(
  '/enrollments/my',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: enrollmentQuerySchema }),
  controller.listForParent
);

router.get(
  '/enrollments/:id/sessions',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: enrollmentIdParam, query: sessionQuerySchema }),
  controller.listSessions
);

router.patch(
  '/enrollments/:id/pause',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: enrollmentIdParam }),
  controller.pause
);

router.patch(
  '/enrollments/:id/resume',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: enrollmentIdParam }),
  controller.resume
);

router.patch(
  '/enrollments/:id/cancel',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: enrollmentIdParam }),
  controller.cancel
);

router.patch(
  '/enrollment-sessions/:id/cancel',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: sessionIdParam, body: cancelSessionSchema }),
  controller.cancelSession
);

router.patch(
  '/enrollment-sessions/:id/report-no-show',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: sessionIdParam }),
  controller.reportNoShow
);

router.get(
  '/enrollments/:id/materials',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: enrollmentIdParam }),
  controller.getCourseMaterials
);

// ==========================================
// TUTOR ROUTES
// ==========================================

router.get(
  '/enrollments/tutor',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ query: enrollmentQuerySchema }),
  controller.listForTutor
);

router.get(
  '/enrollments/tutor/:id/sessions',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: enrollmentIdParam, query: sessionQuerySchema }),
  controller.listSessionsForTutor
);

router.patch(
  '/enrollments/:id/meeting-link',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: enrollmentIdParam, body: updateMeetingLinkSchema }),
  controller.updateMeetingLink
);

// ==========================================
// ADMIN ROUTES
// ==========================================

router.get(
  '/admin/enrollments',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ query: enrollmentQuerySchema }),
  controller.listAll
);

router.patch(
  '/admin/enrollments/:id/reassign',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: enrollmentIdParam, body: reassignTutorSchema }),
  controller.reassignTutor
);

router.get(
  '/admin/enrollments/:id/sessions',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: enrollmentIdParam, query: sessionQuerySchema }),
  controller.adminListSessions
);

router.get(
  '/admin/enrollments/:id/tutors',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: enrollmentIdParam }),
  controller.listTutorsForReassign
);

router.patch(
  '/admin/enrollments/:id/cancel',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: enrollmentIdParam }),
  controller.adminCancel
);

router.patch(
  '/admin/enrollments/:id/pause',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: enrollmentIdParam }),
  controller.adminPause
);

router.patch(
  '/admin/enrollments/:id/resume',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: enrollmentIdParam }),
  controller.adminResume
);

router.patch(
  '/admin/enrollment-sessions/:id/review-no-show',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  validate({ params: sessionIdParam, body: reviewNoShowSchema }),
  controller.reviewNoShow
);

// ==========================================
// SHARED (must be last — :id param)
// ==========================================

router.get(
  '/enrollments/:id',
  authenticate,
  validate({ params: enrollmentIdParam }),
  controller.getById
);

export default router;
