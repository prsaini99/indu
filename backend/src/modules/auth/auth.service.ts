import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Role, TokenType } from '@prisma/client';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/apiError';
import {
  SignupDTO,
  LoginDTO,
  TokenPayload,
  AuthTokens,
  ResetPasswordDTO,
  ChangePasswordDTO,
  ForceChangePasswordDTO,
} from './auth.types';

export class AuthService {
  // ==========================================
  // SIGNUP (Parent self-registration)
  // ==========================================
  async signup(data: SignupDTO) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw ApiError.conflict('DUPLICATE_ENTRY', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          role: Role.PARENT,
          isEmailVerified: false,
          ...(data.timezone ? { timezone: data.timezone } : {}),
          parentProfile: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone,
            },
          },
        },
        select: { id: true, email: true, role: true },
      });

      return newUser;
    });

    // Link any orphan DemoRequests from public submissions (match by email)
    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: user.id } });
    if (parentProfile) {
      await prisma.demoRequest.updateMany({
        where: { contactEmail: data.email.toLowerCase(), parentId: null },
        data: { parentId: parentProfile.id },
      });
    }

    // Generate email verification token — store in DB
    const verificationToken = uuidv4();
    await prisma.token.create({
      data: {
        userId: user.id,
        type: TokenType.EMAIL_VERIFICATION,
        value: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // TODO (M12): Send verification email via AWS SES
    const verifyUrl = `${env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
    if (env.NODE_ENV === 'development') {
      console.log(`\n📧 Email verification for ${user.email}:`);
      console.log(`   ${verifyUrl}\n`);
    }

    return { message: 'Account created. Please check your email to verify.' };
  }

  // ==========================================
  // LOGIN
  // ==========================================
  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        adminPermissions: { select: { permission: true } },
        parentProfile: { select: { firstName: true, lastName: true } },
        tutorProfile: { select: { firstName: true, lastName: true } },
        consultantProfile: { select: { firstName: true, lastName: true } },
      },
    });

    if (!user || user.deletedAt) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been disabled. Contact support.');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isEmailVerified && user.role === Role.PARENT) {
      throw ApiError.badRequest('EMAIL_NOT_VERIFIED', 'Please verify your email before logging in');
    }

    if (user.forcePasswordChange) {
      throw ApiError.badRequest(
        'PASSWORD_CHANGE_REQUIRED',
        'You must change your temporary password before continuing'
      );
    }

    const permissions = user.adminPermissions.map((ap) => ap.permission);
    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: permissions.length > 0 ? permissions : undefined,
    });

    // Store refresh token in DB (remove old ones first)
    await prisma.token.deleteMany({
      where: { userId: user.id, type: TokenType.REFRESH },
    });
    await prisma.token.create({
      data: {
        userId: user.id,
        type: TokenType.REFRESH,
        value: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update last login + timezone
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(data.timezone ? { timezone: data.timezone } : {}),
      },
    });

    const profile =
      user.parentProfile || user.tutorProfile || user.consultantProfile;
    const firstName = profile?.firstName || '';
    const lastName = profile?.lastName || '';

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName,
        lastName,
        permissions,
        timezone: user.timezone,
      },
      refreshToken: tokens.refreshToken,
    };
  }

  // ==========================================
  // REFRESH TOKEN
  // ==========================================
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Check if refresh token exists in DB and is not expired
    const storedToken = await prisma.token.findFirst({
      where: {
        userId: decoded.sub,
        type: TokenType.REFRESH,
        value: refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        adminPermissions: { select: { permission: true } },
        parentProfile: { select: { firstName: true, lastName: true } },
        tutorProfile: { select: { firstName: true, lastName: true } },
        consultantProfile: { select: { firstName: true, lastName: true } },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw ApiError.unauthorized('User account is disabled');
    }

    const permissions = user.adminPermissions.map((ap) => ap.permission);

    const accessToken = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: permissions.length > 0 ? permissions : undefined,
    });

    const profile = user.parentProfile || user.tutorProfile || user.consultantProfile;

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        permissions,
        timezone: user.timezone,
      },
    };
  }

  // ==========================================
  // LOGOUT
  // ==========================================
  async logout(userId: string) {
    // Remove all refresh tokens for this user
    await prisma.token.deleteMany({
      where: { userId, type: TokenType.REFRESH },
    });
    return { message: 'Logged out successfully' };
  }

  // ==========================================
  // VERIFY EMAIL
  // ==========================================
  async verifyEmail(token: string) {
    const storedToken = await prisma.token.findFirst({
      where: {
        value: token,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw ApiError.badRequest('INVALID_TOKEN', 'Verification token is invalid or expired');
    }

    await prisma.user.update({
      where: { id: storedToken.userId },
      data: { isEmailVerified: true },
    });

    // Remove the used token
    await prisma.token.delete({ where: { id: storedToken.id } });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    // Remove any existing reset tokens for this user
    await prisma.token.deleteMany({
      where: { userId: user.id, type: TokenType.PASSWORD_RESET },
    });

    const resetToken = uuidv4();
    await prisma.token.create({
      data: {
        userId: user.id,
        type: TokenType.PASSWORD_RESET,
        value: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO (M12): Send reset email via AWS SES
    const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    if (env.NODE_ENV === 'development') {
      console.log(`\n🔑 Password reset for ${user.email}:`);
      console.log(`   ${resetUrl}\n`);
    }

    return { message: 'If this email exists, a reset link has been sent.' };
  }

  // ==========================================
  // RESET PASSWORD
  // ==========================================
  async resetPassword(data: ResetPasswordDTO) {
    const storedToken = await prisma.token.findFirst({
      where: {
        value: data.token,
        type: TokenType.PASSWORD_RESET,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw ApiError.badRequest('INVALID_TOKEN', 'Reset token is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: storedToken.userId },
      data: { passwordHash, forcePasswordChange: false },
    });

    // Remove all tokens for this user (reset + refresh = force re-login)
    await prisma.token.deleteMany({
      where: {
        userId: storedToken.userId,
        type: { in: [TokenType.PASSWORD_RESET, TokenType.REFRESH] },
      },
    });

    return { message: 'Password reset successfully.' };
  }

  // ==========================================
  // CHANGE PASSWORD (for forced change or voluntary)
  // ==========================================
  async changePassword(userId: string, data: ChangePasswordDTO) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw ApiError.badRequest('INVALID_PASSWORD', 'Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, forcePasswordChange: false },
    });

    return { message: 'Password changed successfully.' };
  }

  // ==========================================
  // FORCE CHANGE PASSWORD (for admin-provisioned accounts)
  // ==========================================
  async forceChangePassword(data: ForceChangePasswordDTO) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user || user.deletedAt) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.forcePasswordChange) {
      throw ApiError.badRequest('NOT_REQUIRED', 'Password change is not required for this account');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, forcePasswordChange: false },
    });

    return { message: 'Password updated successfully. You can now log in.' };
  }

  // ==========================================
  // TOKEN HELPERS
  // ==========================================
  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = this.generateAccessToken(payload);

    const refreshToken = jwt.sign(
      { sub: payload.sub, email: payload.email, role: payload.role },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number }
    );

    return { accessToken, refreshToken };
  }

  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        ...(payload.permissions && { permissions: payload.permissions }),
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number }
    );
  }
}
