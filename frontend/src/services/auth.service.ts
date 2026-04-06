import api, { setAccessToken } from './api';
import { getBrowserTimezone } from '@/lib/utils';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    permissions: string[];
    timezone: string;
  };
}

export interface SignupResponse {
  message: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post('/auth/login', { email, password, timezone: getBrowserTimezone() });
    setAccessToken(data.data.accessToken);
    return data.data;
  },

  async signup(email: string, password: string, firstName: string, lastName: string): Promise<SignupResponse> {
    const { data } = await api.post('/auth/signup', { email, password, firstName, lastName, timezone: getBrowserTimezone() });
    return data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async refresh(): Promise<LoginResponse | null> {
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessToken(data.data.accessToken);
      return data.data;
    } catch {
      setAccessToken(null);
      return null;
    }
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const { data } = await api.get(`/auth/verify-email?token=${token}`);
    return data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  async forceChangePassword(email: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/force-change-password', { email, currentPassword, newPassword });
    return data.data;
  },
};
