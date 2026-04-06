import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { validate } from '../../shared/middlewares/validate';
import { notificationIdParam, notificationQuerySchema } from './notification.validators';

const router = Router();
const controller = new NotificationController();

// read-all MUST come before :id to avoid "read-all" matching as :id
router.patch('/notifications/read-all', authenticate, controller.markAllAsRead);
router.get('/notifications/unread-count', authenticate, controller.getUnreadCount);
router.get('/notifications/my', authenticate, validate({ query: notificationQuerySchema }), controller.getMyNotifications);
router.patch('/notifications/:id/read', authenticate, validate({ params: notificationIdParam }), controller.markAsRead);

export default router;
