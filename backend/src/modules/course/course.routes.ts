import { Router } from 'express';
import { Role, Permission } from '@prisma/client';
import { CourseController } from './course.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';
import { validate } from '../../shared/middlewares/validate';
import {
  courseIdParam,
  materialIdParam,
  gradeTierIdParam,
  courseTutorParams,
  createCourseSchema,
  updateCourseSchema,
  courseSearchQuerySchema,
  createCourseMaterialSchema,
  updateGradeTierSchema,
  assignTutorToCourseSchema,
} from './course.validators';

const router = Router();
const controller = new CourseController();

// ==========================================
// PUBLIC: COURSE DIRECTORY
// ==========================================

router.get(
  '/courses',
  validate({ query: courseSearchQuerySchema }),
  controller.listCourses
);

router.get(
  '/courses/:id',
  validate({ params: courseIdParam }),
  controller.getCourseDetail
);

// ==========================================
// TUTOR: MY COURSES & MATERIALS
// ==========================================

router.get(
  '/tutors/my-courses',
  authenticate,
  requireRole(Role.TUTOR),
  controller.listTutorCourses
);

router.post(
  '/tutors/courses/:id/materials',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: courseIdParam, body: createCourseMaterialSchema }),
  controller.tutorAddMaterial
);

router.delete(
  '/tutors/courses/:id/materials/:materialId',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: materialIdParam }),
  controller.tutorRemoveMaterial
);

// ==========================================
// ADMIN: GRADE TIERS
// ==========================================

router.get(
  '/admin/grade-tiers',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.CREDIT_MANAGEMENT),
  controller.listGradeTiers
);

router.patch(
  '/admin/grade-tiers/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.CREDIT_MANAGEMENT),
  validate({ params: gradeTierIdParam, body: updateGradeTierSchema }),
  controller.updateGradeTier
);

// ==========================================
// ADMIN: COURSE LIST (includes inactive)
// ==========================================

router.get(
  '/admin/courses',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.COURSE_MANAGEMENT),
  validate({ query: courseSearchQuerySchema }),
  controller.adminListCourses
);

// ==========================================
// ADMIN: COURSE CRUD
// ==========================================

router.post(
  '/admin/courses',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.COURSE_MANAGEMENT),
  validate({ body: createCourseSchema }),
  controller.createCourse
);

router.patch(
  '/admin/courses/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.COURSE_MANAGEMENT),
  validate({ params: courseIdParam, body: updateCourseSchema }),
  controller.updateCourse
);

router.delete(
  '/admin/courses/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.COURSE_MANAGEMENT),
  validate({ params: courseIdParam }),
  controller.softDeleteCourse
);

// ==========================================
// ADMIN: COURSE MATERIALS
// ==========================================

router.post(
  '/admin/courses/:id/materials',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.COURSE_MANAGEMENT),
  validate({ params: courseIdParam, body: createCourseMaterialSchema }),
  controller.addMaterial
);

router.delete(
  '/admin/courses/:id/materials/:materialId',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.COURSE_MANAGEMENT),
  validate({ params: materialIdParam }),
  controller.removeMaterial
);

// ==========================================
// ADMIN: TUTOR-COURSE ASSIGNMENT
// ==========================================

router.post(
  '/admin/courses/:id/tutors',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.COURSE_MANAGEMENT),
  validate({ params: courseIdParam, body: assignTutorToCourseSchema }),
  controller.assignTutorToCourse
);

router.delete(
  '/admin/courses/:id/tutors/:tutorId',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.COURSE_MANAGEMENT),
  validate({ params: courseTutorParams }),
  controller.removeTutorFromCourse
);

export default router;
