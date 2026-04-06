import { Request, Response, NextFunction } from 'express';
import { TutorService } from './tutor.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new TutorService();

export class TutorController {
  // ==========================================
  // M3: PUBLIC — TUTOR DIRECTORY
  // ==========================================

  async searchTutors(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.searchTutors(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getTutorPublicProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getTutorPublicProfile(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // M3: TUTOR SELF-MANAGEMENT
  // ==========================================

  async getOwnProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getOwnProfile(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateOwnProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.updateOwnProfile(req.user!.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMyStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getMyStudents(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getDashboardSummary(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // M3: CERTIFICATIONS
  // ==========================================

  async getOwnCertifications(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getOwnCertifications(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async addCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.addCertification(req.user!.id, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.deleteCertification(req.user!.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // M3: ADMIN TUTOR MANAGEMENT
  // ==========================================

  async adminListTutors(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.adminListTutors(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async adminUpdateTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.adminUpdateTutor(req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async adminToggleTutorStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.adminToggleTutorStatus(req.params.id as string, req.body.isActive);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async softDeleteTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.softDeleteTutor(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async adminGetPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.adminGetPerformance(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async adminAssignCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.adminAssignCourse(req.params.id as string, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async adminRemoveCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.adminRemoveCourse(req.params.id as string, req.params.courseId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // M5: AVAILABILITY TEMPLATES
  // ==========================================

  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getTemplates(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.createTemplate(req.user!.id, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.deleteTemplate(req.user!.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // M5: BLOCKED DATES
  // ==========================================

  async getBlockedDates(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getBlockedDates(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createBlockedDate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.createBlockedDate(req.user!.id, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteBlockedDate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.deleteBlockedDate(req.user!.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // M5: COMPUTE AVAILABILITY
  // ==========================================

  async computeAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate: string; endDate: string };
      const result = await service.computeAvailability(req.params.id as string, startDate, endDate);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
