import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendSuccess = (
  res: Response,
  data: unknown,
  statusCode: number = 200,
  meta?: PaginationMeta
) => {
  const response: Record<string, unknown> = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400
) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, statusCode },
  });
};
