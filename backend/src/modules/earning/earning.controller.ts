import { Request, Response, NextFunction } from 'express';
import { EarningService } from './earning.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new EarningService();

export class EarningController {
  // ==========================================
  // TUTOR: EARNINGS
  // ==========================================

  async listForTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listForTutor(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getSummaryForTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getSummaryForTutor(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: EARNINGS
  // ==========================================

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAll(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getAdminSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getAdminSummary();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await service.exportCsv(req.query as Record<string, string>);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tutor-earnings.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async createPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.createPayout(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async listPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listPayouts(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
