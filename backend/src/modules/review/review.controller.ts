import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new ReviewService();

export class ReviewController {
  // ==========================================
  // PARENT: REVIEWS
  // ==========================================

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.create(req.user!.id, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async listByParent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listByParent(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // PUBLIC: TUTOR REVIEWS
  // ==========================================

  async listByTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listByTutor(req.params.id as string, req.query as Record<string, string>);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // TUTOR: OWN REVIEWS
  // ==========================================

  async listForOwnTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listForOwnTutor(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: REVIEWS
  // ==========================================

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAll(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async updateVisibility(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.updateVisibility(req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
