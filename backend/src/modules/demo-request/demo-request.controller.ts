import { Request, Response, NextFunction } from 'express';
import { DemoRequestService } from './demo-request.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new DemoRequestService();

export class DemoRequestController {
  // PUBLIC: Submit demo request (no auth needed)
  async createPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.createPublic(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // PARENT: Submit demo request (authenticated)
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.create(req.user!.id, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // PARENT: List own requests
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listMine(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // ANY: Get single request (access-controlled)
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getById(req.user!.id, req.user!.role, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // PARENT: Cancel own request
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.cancel(req.user!.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // CONSULTANT: List requests
  async listForConsultant(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listForConsultant(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // CONSULTANT: Self-assign
  async assignToMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.assignToMe(req.user!.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // CONSULTANT/ADMIN: Update status
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.updateStatus(
        req.user!.id,
        req.user!.role,
        req.params.id as string,
        req.body.status
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ADMIN: List all
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAll(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
