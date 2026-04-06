import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { validate } from '../../shared/middlewares/validate';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  forceChangePasswordSchema,
} from './auth.validators';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/signup', validate({ body: signupSchema }), controller.signup);
router.post('/login', validate({ body: loginSchema }), controller.login);
router.post('/refresh', controller.refresh);
router.get('/verify-email', controller.verifyEmail);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), controller.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), controller.resetPassword);
router.post('/force-change-password', validate({ body: forceChangePasswordSchema }), controller.forceChangePassword);

// Protected routes
router.post('/logout', authenticate, controller.logout);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), controller.changePassword);

export default router;
