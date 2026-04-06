import { Router } from 'express';
import { Role, Permission } from '@prisma/client';
import { AssessmentController } from './assessment.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { requirePermission } from '../../shared/middlewares/permission';
import { validate } from '../../shared/middlewares/validate';
import {
  createAssessmentResultSchema,
  updateAssessmentResultSchema,
  assessmentQuerySchema,
  assessmentIdParam,
  documentIdParam,
  childIdParam,
  childAssessmentQuerySchema,
  progressQuerySchema,
  uploadDocumentSchema,
} from './assessment.validators';

const router = Router();
const controller = new AssessmentController();

// ==========================================
// TUTOR: ASSESSMENT RESULTS
// ==========================================

router.get(
  '/assessment-results/my-students',
  authenticate,
  requireRole(Role.TUTOR),
  controller.getMyStudents
);

router.post(
  '/assessment-results',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ body: createAssessmentResultSchema }),
  controller.create
);

router.get(
  '/assessment-results',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ query: assessmentQuerySchema }),
  controller.list
);

router.patch(
  '/assessment-results/:id',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: assessmentIdParam, body: updateAssessmentResultSchema }),
  controller.update
);

router.delete(
  '/assessment-results/:id',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: assessmentIdParam }),
  controller.remove
);

// ==========================================
// TUTOR: DOCUMENTS
// ==========================================

router.post(
  '/assessment-results/:id/documents',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: assessmentIdParam, body: uploadDocumentSchema }),
  controller.uploadDocument
);

router.delete(
  '/assessment-results/:id/documents/:docId',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ params: documentIdParam }),
  controller.deleteDocument
);

// ==========================================
// PARENT: CHILD RESULTS & PROGRESS
// ==========================================

router.get(
  '/parents/children/:childId/assessment-results',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: childIdParam, query: childAssessmentQuerySchema }),
  controller.getChildResults
);

router.get(
  '/parents/children/:childId/progress',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: childIdParam, query: progressQuerySchema }),
  controller.getChildProgress
);

// ==========================================
// PARENT: DOWNLOAD DOCUMENT
// ==========================================

router.get(
  '/assessment-results/:id/documents/:docId/download',
  authenticate,
  requireRole(Role.PARENT),
  validate({ params: documentIdParam }),
  controller.downloadDocument
);

// ==========================================
// SHARED: GET BY ID (Tutor or Parent — role checked in service)
// ==========================================

router.get(
  '/assessment-results/:id',
  authenticate,
  validate({ params: assessmentIdParam }),
  controller.getById
);

// ==========================================
// ADMIN
// ==========================================

router.get(
  '/admin/assessment-results',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  requirePermission(Permission.USER_MANAGEMENT),
  validate({ query: assessmentQuerySchema }),
  controller.listAll
);

export default router;
