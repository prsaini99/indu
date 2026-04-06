import { Router } from 'express';
import { Role, Permission } from '@prisma/client';
import { TutorController } from './tutor.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';
import { validate } from '../../shared/middlewares/validate';
import {
  tutorIdParam,
  certIdParam,
  templateIdParam,
  blockedDateIdParam,
  tutorCourseParams,
  updateTutorProfileSchema,
  createCertificationSchema,
  adminUpdateTutorSchema,
  adminAssignCourseSchema,
  adminToggleStatusSchema,
  createTemplateSchema,
  createBlockedDateSchema,
  availabilityQuerySchema,
  tutorSearchQuerySchema,
} from './tutor.validators';

const router = Router();
const controller = new TutorController();

// ==========================================
// TUTOR SELF-MANAGEMENT (BEFORE /:id routes)
// ==========================================

router.get(
  '/tutors/profile',
  authenticate,
  requireRole(Role.TUTOR),
  controller.getOwnProfile
);

router.patch(
  '/tutors/profile',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ body: updateTutorProfileSchema }),
  controller.updateOwnProfile
);

router.get(
  '/tutors/my-students',
  authenticate,
  requireRole(Role.TUTOR),
  controller.getMyStudents
);

router.get(
  '/tutors/dashboard',
  authenticate,
  requireRole(Role.TUTOR),
  controller.getDashboardSummary
);

// ==========================================
// TUTOR CERTIFICATIONS
// ==========================================

router.get(
  '/tutors/certifications',
  authenticate,
  requireRole(Role.TUTOR),
  controller.getOwnCertifications
);

router.post(
  '/tutors/certifications',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ body: createCertificationSchema }),
  controller.addCertification
);

router.delete(
  '/tutors/certifications/:id',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: certIdParam }),
  controller.deleteCertification
);

// ==========================================
// M5: TUTOR AVAILABILITY SELF-MANAGEMENT
// ==========================================

router.get(
  '/tutors/availability/templates',
  authenticate,
  requireRole(Role.TUTOR),
  controller.getTemplates
);

router.post(
  '/tutors/availability/templates',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ body: createTemplateSchema }),
  controller.createTemplate
);

router.delete(
  '/tutors/availability/templates/:id',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: templateIdParam }),
  controller.deleteTemplate
);

router.get(
  '/tutors/availability/blocked-dates',
  authenticate,
  requireRole(Role.TUTOR),
  controller.getBlockedDates
);

router.post(
  '/tutors/availability/blocked-dates',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ body: createBlockedDateSchema }),
  controller.createBlockedDate
);

router.delete(
  '/tutors/availability/blocked-dates/:id',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: blockedDateIdParam }),
  controller.deleteBlockedDate
);

// ==========================================
// PUBLIC TUTOR DIRECTORY (no auth)
// ==========================================

router.get(
  '/tutors',
  validate({ query: tutorSearchQuerySchema }),
  controller.searchTutors
);

router.get(
  '/tutors/:id',
  validate({ params: tutorIdParam }),
  controller.getTutorPublicProfile
);

// ==========================================
// TUTOR AVAILABILITY — AUTHENTICATED (any role)
// ==========================================

router.get(
  '/tutors/:id/availability',
  authenticate,
  validate({ params: tutorIdParam, query: availabilityQuerySchema }),
  controller.computeAvailability
);

// ==========================================
// ADMIN TUTOR MANAGEMENT
// ==========================================

router.get(
  '/admin/tutors',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_MANAGEMENT),
  validate({ query: tutorSearchQuerySchema }),
  controller.adminListTutors
);

router.patch(
  '/admin/tutors/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_MANAGEMENT),
  validate({ params: tutorIdParam, body: adminUpdateTutorSchema }),
  controller.adminUpdateTutor
);

router.patch(
  '/admin/tutors/:id/status',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_MANAGEMENT),
  validate({ params: tutorIdParam, body: adminToggleStatusSchema }),
  controller.adminToggleTutorStatus
);

router.delete(
  '/admin/tutors/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_MANAGEMENT),
  validate({ params: tutorIdParam }),
  controller.softDeleteTutor
);

router.get(
  '/admin/tutors/:id/performance',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_MANAGEMENT),
  validate({ params: tutorIdParam }),
  controller.adminGetPerformance
);

router.post(
  '/admin/tutors/:id/courses',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_MANAGEMENT),
  validate({ params: tutorIdParam, body: adminAssignCourseSchema }),
  controller.adminAssignCourse
);

router.delete(
  '/admin/tutors/:id/courses/:courseId',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.TUTOR_MANAGEMENT),
  validate({ params: tutorCourseParams }),
  controller.adminRemoveCourse
);

export default router;
