import { Router } from 'express';
import { Role } from '@prisma/client';
import { RecordingController } from './recording.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { requireRole } from '../../shared/middlewares/authorize';
import { validate } from '../../shared/middlewares/validate';
import { sessionIdParam, demoBookingIdParam, recordingIdParam, recordingQuerySchema } from './recording.validators';

const router = Router();
const controller = new RecordingController();

// ==========================================
// ZOOM WEBHOOK (no auth — signature verified in controller)
// Raw body middleware applied in app.ts
// ==========================================

router.post(
  '/recordings/webhook',
  controller.handleWebhook
);

// ==========================================
// PARENT: List my recordings
// ==========================================

router.get(
  '/recordings/my',
  authenticate,
  requireRole(Role.PARENT),
  validate({ query: recordingQuerySchema }),
  controller.getMyRecordings
);

// ==========================================
// TUTOR: List my recordings
// ==========================================

router.get(
  '/recordings/tutor/my',
  authenticate,
  requireRole(Role.TUTOR),
  validate({ query: recordingQuerySchema }),
  controller.getTutorRecordings
);

// ==========================================
// PARENT / TUTOR: Get recording playback URL
// ==========================================

router.get(
  '/recordings/session/:sessionId/url',
  authenticate,
  requireRole(Role.PARENT, Role.TUTOR),
  validate({ params: sessionIdParam }),
  controller.getSessionRecordingUrl
);

router.get(
  '/recordings/demo/:demoBookingId/url',
  authenticate,
  requireRole(Role.PARENT, Role.CONSULTANT),
  validate({ params: demoBookingIdParam }),
  controller.getDemoRecordingUrl
);

// ==========================================
// ADMIN: Recordings management
// ==========================================

router.get(
  '/admin/recordings',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  validate({ query: recordingQuerySchema }),
  controller.listAllRecordings
);

router.post(
  '/admin/recordings/:id/retry',
  authenticate,
  requireRole(Role.SUPER_ADMIN, Role.ADMIN),
  validate({ params: recordingIdParam }),
  controller.retryRecording
);

export default router;
