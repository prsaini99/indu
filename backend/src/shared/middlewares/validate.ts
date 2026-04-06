import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // req.query has a getter-only property in Express; merge parsed values back
        Object.keys(req.query).forEach((k) => delete (req.query as Record<string, unknown>)[k]);
        Object.assign(req.query, parsed);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = (error.issues || []).map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        return _res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            statusCode: 400,
            details: formattedErrors,
          },
        });
      }
      next(error);
    }
  };
};
