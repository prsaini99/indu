export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(code: string, message: string) {
    return new ApiError(code, message, 400);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message: string = 'Forbidden') {
    return new ApiError('FORBIDDEN', message, 403);
  }

  static notFound(message: string = 'Resource not found') {
    return new ApiError('NOT_FOUND', message, 404);
  }

  static conflict(code: string, message: string) {
    return new ApiError(code, message, 409);
  }

  static internal(message: string = 'Internal server error') {
    return new ApiError('INTERNAL_ERROR', message, 500);
  }
}
