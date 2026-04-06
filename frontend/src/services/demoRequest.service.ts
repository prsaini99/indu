import api from './api';

export interface PublicDemoRequestPayload {
  parentName: string;
  contactEmail: string;
  contactPhone: string;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth?: string;
  boardId: string;
  gradeId: string;
  subjectIds: string[];
  preferredTimeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING';
  preferredDate: string;
  alternativeDate?: string;
  notes?: string;
}

export interface DemoRequest {
  id: string;
  parentName: string;
  contactEmail: string;
  contactPhone: string | null;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth: string | null;
  board: { id: string; name: string };
  grade: { id: string; name: string };
  subjects: { id: string; name: string }[];
  preferredTimeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING';
  preferredDate: string;
  alternativeDate: string | null;
  notes: string | null;
  status: 'PENDING' | 'ASSIGNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  parent: { id: string; firstName: string; lastName: string } | null;
  consultant: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDemoRequestPayload {
  contactEmail: string;
  contactPhone?: string;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth?: string;
  boardId: string;
  gradeId: string;
  subjectIds: string[];
  preferredTimeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING';
  preferredDate: string;
  alternativeDate?: string;
  notes?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Parent methods
export const demoRequestService = {
  async create(payload: CreateDemoRequestPayload): Promise<DemoRequest> {
    const { data } = await api.post('/demo-requests', payload);
    return data.data;
  },

  async listMine(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: DemoRequest[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const { data } = await api.get(`/demo-requests/my?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<DemoRequest> {
    const { data } = await api.get(`/demo-requests/${id}`);
    return data.data;
  },

  async cancel(id: string): Promise<DemoRequest> {
    const { data } = await api.delete(`/demo-requests/${id}/cancel`);
    return data.data;
  },
};

// Public (no auth) methods
export const publicDemoService = {
  async submit(payload: PublicDemoRequestPayload): Promise<{ message: string }> {
    const { data } = await api.post('/demo-requests/public', payload);
    return data;
  },
};

// Admin methods
export const adminDemoRequestService = {
  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: DemoRequest[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const { data } = await api.get(`/demo-requests/admin?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },
};

// Consultant methods
export const consultantDemoService = {
  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: DemoRequest[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const { data } = await api.get(`/demo-requests/consultant?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async assignToMe(id: string): Promise<DemoRequest> {
    const { data } = await api.patch(`/demo-requests/${id}/assign`);
    return data.data;
  },

  async updateStatus(id: string, status: string): Promise<DemoRequest> {
    const { data } = await api.patch(`/demo-requests/${id}/status`, { status });
    return data.data;
  },
};
