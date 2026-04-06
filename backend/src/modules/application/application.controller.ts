import { Request, Response, NextFunction } from 'express';
import { applicationService } from './application.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

class ApplicationController {
  // Public: submit application
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.create(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // Admin: list all applications
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.listAll(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // Admin: get single application
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.getById(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Admin: review (approve/reject)
  async review(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.review(req.params.id, req.user!.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const applicationController = new ApplicationController();
