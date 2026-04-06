import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { sendSuccess } from '../../shared/utils/apiResponse';
import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';

const userService = new UserService();

export class UserController {
  // ==========================================
  // PARENT PROFILE
  // ==========================================
  async getParentProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getParentProfile(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateParentProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.updateParentProfile(req.user!.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // CHILD MANAGEMENT
  // ==========================================
  async getChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getChildren(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // CONSULTANT PROFILE
  // ==========================================
  async getConsultantProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getConsultantProfile(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateConsultantProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.updateConsultantProfile(req.user!.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: USER MANAGEMENT
  // ==========================================
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.listUsers(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getUserById(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.createAdminUser(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.updateUserStatus(req.params.id as string, req.body.isActive);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async softDeleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.softDeleteUser(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getUserPermissions(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async setPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.setPermissions(req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: CHILD MANAGEMENT
  // ==========================================
  async adminGetChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const parent = await prisma.parentProfile.findUnique({ where: { id: req.params.parentId as string }, select: { userId: true } });
      if (!parent) throw ApiError.notFound('Parent profile not found');
      const result = await userService.getChildren(parent.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async adminCreateChild(req: Request, res: Response, next: NextFunction) {
    try {
      const parent = await prisma.parentProfile.findUnique({ where: { id: req.params.parentId as string }, select: { userId: true } });
      if (!parent) throw ApiError.notFound('Parent profile not found');
      const result = await userService.createChild(parent.userId, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async adminUpdateChild(req: Request, res: Response, next: NextFunction) {
    try {
      const parent = await prisma.parentProfile.findUnique({ where: { id: req.params.parentId as string }, select: { userId: true } });
      if (!parent) throw ApiError.notFound('Parent profile not found');
      const result = await userService.updateChild(parent.userId, req.params.childId as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async adminDeleteChild(req: Request, res: Response, next: NextFunction) {
    try {
      const parent = await prisma.parentProfile.findUnique({ where: { id: req.params.parentId as string }, select: { userId: true } });
      if (!parent) throw ApiError.notFound('Parent profile not found');
      const result = await userService.deleteChild(parent.userId, req.params.childId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
