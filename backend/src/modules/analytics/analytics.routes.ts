import { Router } from 'express';
import { Role, Permission } from '@prisma/client';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';

const router = Router();
const controller = new AnalyticsController();

router.get(
  '/admin/analytics/dashboard',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.ANALYTICS_ACCESS),
  controller.getDashboardStats
);

export default router;
