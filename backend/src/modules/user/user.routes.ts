import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';
import { validate } from '../../shared/middlewares/validate';
import { Role, Permission } from '@prisma/client';
import {
  updateParentProfileSchema,
  createChildSchema,
  updateChildSchema,
  createUserSchema,
  updateUserStatusSchema,
  setPermissionsSchema,
  updateConsultantProfileSchema,
  userIdParam,
  childIdParam,
  parentIdParam,
  parentChildParams,
} from './user.validators';

const router = Router();
const controller = new UserController();

// ==========================================
// PARENT ROUTES
// ==========================================
router.get(
  '/parents/profile',
  authenticate,
  requireRole(Role.PARENT),
  controller.getParentProfile
);

router.patch(
  '/parents/profile',
  authenticate,
  requireRole(Role.PARENT),
  validate({ body: updateParentProfileSchema }),
  controller.updateParentProfile
);

// Parent: read-only access to children
router.get(
  '/parents/children',
  authenticate,
  requireRole(Role.PARENT),
  controller.getChildren
);

// ==========================================
// CONSULTANT ROUTES
// ==========================================
router.get(
  '/consultants/profile',
  authenticate,
  requireRole(Role.CONSULTANT),
  controller.getConsultantProfile
);

router.patch(
  '/consultants/profile',
  authenticate,
  requireRole(Role.CONSULTANT),
  validate({ body: updateConsultantProfileSchema }),
  controller.updateConsultantProfile
);

// ==========================================
// ADMIN USER MANAGEMENT ROUTES
// ==========================================
router.get(
  '/admin/users',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  controller.listUsers
);

router.get(
  '/admin/users/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ params: userIdParam }),
  controller.getUserById
);

router.post(
  '/admin/users',
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  validate({ body: createUserSchema }),
  controller.createUser
);

router.patch(
  '/admin/users/:id/status',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ params: userIdParam, body: updateUserStatusSchema }),
  controller.updateUserStatus
);

router.delete(
  '/admin/users/:id',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ params: userIdParam }),
  controller.softDeleteUser
);

router.get(
  '/admin/users/:id/permissions',
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  validate({ params: userIdParam }),
  controller.getUserPermissions
);

router.put(
  '/admin/users/:id/permissions',
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  validate({ params: userIdParam, body: setPermissionsSchema }),
  controller.setPermissions
);

// ==========================================
// ADMIN: CHILD MANAGEMENT (per parent)
// ==========================================
router.get(
  '/admin/parents/:parentId/children',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ params: parentIdParam }),
  controller.adminGetChildren
);

router.post(
  '/admin/parents/:parentId/children',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ params: parentIdParam, body: createChildSchema }),
  controller.adminCreateChild
);

router.patch(
  '/admin/parents/:parentId/children/:childId',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ params: parentChildParams, body: updateChildSchema }),
  controller.adminUpdateChild
);

router.delete(
  '/admin/parents/:parentId/children/:childId',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ params: parentChildParams }),
  controller.adminDeleteChild
);

export default router;
