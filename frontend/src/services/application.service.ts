import api from './api';

export interface Application {
  id: string;
  role: 'TUTOR' | 'CONSULTANT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience: number;
  bio: string | null;
  resumeUrl: string | null;
  subjects: string | null;
  qualifications: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationPayload {
  role: 'TUTOR' | 'CONSULTANT';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience?: number;
  bio?: string;
  resumeUrl?: string;
  subjects?: string;
  qualifications?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Public: submit application (no auth)
export const applicationService = {
  async submit(payload: CreateApplicationPayload): Promise<Application> {
    const { data } = await api.post('/applications', payload);
    return data.data;
  },
};

// Admin methods
export const adminApplicationService = {
  async list(params: { page?: number; limit?: number; status?: string; role?: string } = {}): Promise<{ data: Application[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.role) query.set('role', params.role);
    const { data } = await api.get(`/admin/applications?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<Application> {
    const { data } = await api.get(`/admin/applications/${id}`);
    return data.data;
  },

  async review(id: string, payload: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }): Promise<Application> {
    const { data } = await api.patch(`/admin/applications/${id}/review`, payload);
    return data.data;
  },
};
