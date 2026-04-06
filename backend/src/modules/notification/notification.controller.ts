import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new NotificationService();

export class NotificationController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getMyNotifications(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, { notifications: result.data, unreadCount: result.unreadCount }, 200, result.meta);
    } catch (error) { next(error); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await service.getUnreadCount(req.user!.id);
      sendSuccess(res, { unreadCount: count });
    } catch (error) { next(error); }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.markAsRead(req.params.id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.markAllAsRead(req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }
}
