import { Request, Response, NextFunction } from 'express';
import { BatchService } from './batch.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new BatchService();

export class BatchController {
  // ---- ADMIN ----

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.create(req.body);
      sendSuccess(res, result, 201);
    } catch (error) { next(error); }
  }

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAll(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getById(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.update(req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async startBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.startBatch(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async cancelBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.cancelBatch(req.params.id as string, req.body.reason);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async removeStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.removeStudent(req.params.id as string, req.params.studentId as string, req.body.reason);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  // ---- PARENT ----

  async listAvailable(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAvailable(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) { next(error); }
  }

  async joinBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.joinBatch(req.params.id as string, req.user!.id, req.body);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async leaveBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.leaveBatch(req.params.id as string, req.user!.id, req.body.studentId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async listMyBatches(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listMyBatches(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) { next(error); }
  }

  async getBatchDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getBatchDetail(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  // ---- TUTOR ----

  async listForTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listForTutor(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) { next(error); }
  }

  async getTutorBatchDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getTutorBatchDetail(req.params.id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  // ---- PARENT: COURSE MATERIALS ----

  async getCourseMaterials(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getCourseMaterials(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }
}
