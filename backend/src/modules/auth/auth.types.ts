import { Permission, Role } from '@prisma/client';

export interface SignupDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  timezone?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  timezone?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  permissions?: Permission[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface ForceChangePasswordDTO {
  email: string;
  currentPassword: string;
  newPassword: string;
}
