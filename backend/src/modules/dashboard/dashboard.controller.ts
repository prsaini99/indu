import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new DashboardService();

export class DashboardController {
  async getParentDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getParentDashboard(req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async getTutorDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getTutorDashboard(req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async getConsultantDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getConsultantDashboard(req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }
}
