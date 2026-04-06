import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { EnrollmentService } from './enrollment.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const enrollmentService = new EnrollmentService();

export class EnrollmentController {
  // ==========================================
  // PARENT
  // ==========================================

  async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { subjectId, gradeId, duration } = req.query as { subjectId: string; gradeId: string; duration: string };
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { timezone: true },
      });
      const parentTz = user?.timezone || 'Asia/Dubai';
      const result = await enrollmentService.getAvailableSlots(subjectId, gradeId, parseInt(duration, 10), parentTz);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.create(req.user!.id, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async listForParent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.listForParent(req.user!.id, req.query as any);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.getById(req.params.id as string, req.user!.id, req.user!.role);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async pause(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.pause(req.params.id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.resume(req.params.id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.cancel(req.params.id as string, req.user!.id, req.body?.reason);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.listSessions(req.params.id as string, req.user!.id, req.query as any);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async cancelSession(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.cancelSession(req.params.id as string, req.user!.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async reportNoShow(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.reportNoShow(req.params.id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getCourseMaterials(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.getCourseMaterials(req.user!.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // TUTOR
  // ==========================================

  async listForTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.listForTutor(req.user!.id, req.query as any);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async updateMeetingLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.updateMeetingLink(
        req.params.id as string,
        req.user!.id,
        req.body.zoomLink,
        req.body.zoomPassword
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listSessionsForTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.listSessionsForTutor(req.params.id as string, req.user!.id, req.query as any);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN
  // ==========================================

  async adminListSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.adminListSessions(req.params.id as string, req.query as any);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.listAll(req.query as any);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async reassignTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.reassignTutor(req.params.id as string, req.body.tutorId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listTutorsForReassign(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.listTutorsForReassign(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async adminCancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.adminCancel(req.params.id as string, req.body?.reason);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async adminPause(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.adminPause(req.params.id as string, req.body?.reason);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async adminResume(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.adminResume(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async reviewNoShow(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.reviewNoShow(req.params.id as string, req.body.decision, req.body.notes);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
