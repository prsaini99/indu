import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../shared/utils/apiResponse';
import { env } from '../../config/env';

const authService = new AuthService();

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signup(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      // Set refresh token as persistent HttpOnly cookie (7 days)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api',
      });

      // Don't send refreshToken in response body
      const { refreshToken, ...responseData } = result;
      sendSuccess(res, responseData);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const result = await authService.refresh(refreshToken);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.logout(req.user!.id);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', { path: '/api' });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query as { token: string };
      const result = await authService.verifyEmail(token);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.changePassword(req.user!.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async forceChangePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forceChangePassword(req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
