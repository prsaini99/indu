import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new AnalyticsService();

export class AnalyticsController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getDashboardStats();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
