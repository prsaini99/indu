import { Request, Response, NextFunction } from 'express';
import { CourseService } from './course.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new CourseService();

export class CourseController {
  // ==========================================
  // PUBLIC
  // ==========================================

  async listCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listCourses(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getCourseDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getCourseDetail(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async adminListCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.adminListCourses(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: COURSE CRUD
  // ==========================================

  async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.createCourse(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.updateCourse(req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async softDeleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.softDeleteCourse(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: MATERIALS
  // ==========================================

  async addMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.addMaterial(req.params.id as string, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async removeMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.removeMaterial(req.params.id as string, req.params.materialId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // TUTOR: MY COURSES & MATERIALS
  // ==========================================

  async listTutorCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listTutorCourses(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async tutorAddMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.tutorAddMaterial(req.user!.id, req.params.id as string, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async tutorRemoveMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.tutorRemoveMaterial(req.user!.id, req.params.id as string, req.params.materialId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: GRADE TIERS
  // ==========================================

  async listGradeTiers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listGradeTiers();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateGradeTier(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.updateGradeTier(req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: TUTOR-COURSE ASSIGNMENT
  // ==========================================

  async assignTutorToCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.assignTutorToCourse(req.params.id as string, req.body.tutorId, req.body.tutorRate);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async removeTutorFromCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.removeTutorFromCourse(req.params.id as string, req.params.tutorId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
