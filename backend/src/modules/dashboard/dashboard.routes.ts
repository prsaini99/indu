import { Router } from 'express';
import { Role } from '@prisma/client';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';

const router = Router();
const controller = new DashboardController();

router.get('/dashboard/parent', authenticate, requireRole(Role.PARENT), controller.getParentDashboard);
router.get('/dashboard/tutor', authenticate, requireRole(Role.TUTOR), controller.getTutorDashboard);
router.get('/dashboard/consultant', authenticate, requireRole(Role.CONSULTANT), controller.getConsultantDashboard);

export default router;
