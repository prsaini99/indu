import { Request, Response, NextFunction } from 'express';
import { AssessmentService } from './assessment.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new AssessmentService();

export class AssessmentController {
  // ==========================================
  // TUTOR: ASSESSMENT RESULTS
  // ==========================================

  async getMyStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getMyStudents(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.create(req.user!.id, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.list(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getById(req.params.id as string, req.user!.id, req.user!.role);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.update(req.user!.id, req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.delete(req.user!.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // TUTOR: DOCUMENTS
  // ==========================================

  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.generateUploadUrl(req.user!.id, req.params.id as string, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.deleteDocument(req.user!.id, req.params.id as string, req.params.docId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // PARENT: CHILD RESULTS & PROGRESS
  // ==========================================

  async getChildResults(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getChildResults(req.user!.id, req.params.childId as string, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getChildProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getChildProgress(req.user!.id, req.params.childId as string, req.query as Record<string, string>);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getDownloadUrl(req.user!.id, req.params.id as string, req.params.docId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN
  // ==========================================

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAll(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
