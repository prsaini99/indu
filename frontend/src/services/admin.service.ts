import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  isActive?: string;
}

export interface CreateUserPayload {
  email: string;
  role: 'TUTOR' | 'CONSULTANT' | 'ADMIN';
  firstName: string;
  lastName: string;
  phone?: string;
  permissions?: string[];
}

export interface UserPermissions {
  userId: string;
  role: string;
  permissions: string[];
}

export interface AdminChild {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  grade: { id: string; name: string };
  subjects: { id: string; name: string }[];
  notes: string | null;
}

export interface CreateChildPayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gradeId: string;
  subjectIds?: string[];
  notes?: string;
}

export interface UpdateChildPayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gradeId?: string;
  subjectIds?: string[];
  notes?: string;
}

export const adminService = {
  async listUsers(params: ListUsersParams = {}): Promise<{ data: AdminUser[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.role) query.set('role', params.role);
    if (params.search) query.set('search', params.search);
    if (params.isActive !== undefined) query.set('isActive', params.isActive);
    const { data } = await api.get(`/admin/users?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async getUserById(id: string) {
    const { data } = await api.get(`/admin/users/${id}`);
    return data.data;
  },

  async createUser(payload: CreateUserPayload): Promise<{ id: string; email: string; role: string; message: string }> {
    const { data } = await api.post('/admin/users', payload);
    return data.data;
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<{ message: string }> {
    const { data } = await api.patch(`/admin/users/${id}/status`, { isActive });
    return data.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  async getUserPermissions(id: string): Promise<UserPermissions> {
    const { data } = await api.get(`/admin/users/${id}/permissions`);
    return data.data;
  },

  async setPermissions(id: string, permissions: string[]): Promise<{ userId: string; permissions: string[] }> {
    const { data } = await api.put(`/admin/users/${id}/permissions`, { permissions });
    return data.data;
  },

  // Child management (admin)
  async getChildren(parentProfileId: string): Promise<AdminChild[]> {
    const { data } = await api.get(`/admin/parents/${parentProfileId}/children`);
    return data.data;
  },

  async createChild(parentProfileId: string, payload: CreateChildPayload): Promise<AdminChild> {
    const { data } = await api.post(`/admin/parents/${parentProfileId}/children`, payload);
    return data.data;
  },

  async updateChild(parentProfileId: string, childId: string, payload: UpdateChildPayload): Promise<AdminChild> {
    const { data } = await api.patch(`/admin/parents/${parentProfileId}/children/${childId}`, payload);
    return data.data;
  },

  async deleteChild(parentProfileId: string, childId: string): Promise<void> {
    await api.delete(`/admin/parents/${parentProfileId}/children/${childId}`);
  },
};
