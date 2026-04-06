import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ApiError } from '../utils/apiError';
import prisma from '../../config/database';
import { Permission } from '@prisma/client';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions?: Permission[];
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Access token is required');
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw ApiError.unauthorized('User account is disabled or not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: decoded.permissions,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};
