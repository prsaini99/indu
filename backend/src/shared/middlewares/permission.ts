import { Request, Response, NextFunction } from 'express';
import { Permission, Role } from '@prisma/client';
import { ApiError } from '../utils/apiError';

export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Super Admin has all permissions — always pass
    if (req.user.role === Role.SUPER_ADMIN) {
      return next();
    }

    // For Admin role, check specific permissions
    if (req.user.role !== Role.ADMIN) {
      return next(ApiError.forbidden('Admin access required'));
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return next(
        ApiError.forbidden(`Missing required permission: ${permissions.join(' or ')}`)
      );
    }

    next();
  };
};
