import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import logger from '../../config/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error (skip noisy expected 401s)
  const isExpected401 = err instanceof ApiError && err.statusCode === 401;
  if (!isExpected401) {
    if (err instanceof ApiError) {
      logger.warn(err.message, { code: err.code, statusCode: err.statusCode });
    } else {
      logger.error(err.message, { stack: err.stack });
    }
  }

  // Known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      },
    });
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'An unexpected error occurred',
      statusCode: 500,
    },
  });
};
