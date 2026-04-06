import api from './api';

export interface DemoBooking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  meetingLink: string | null;
  meetingPassword: string | null;
  parentNotes: string | null;
  consultantNotes: string | null;
  demoRequest: {
    id: string;
    parentName: string;
    contactEmail: string;
    contactPhone: string;
    childFirstName: string;
    childLastName: string;
  } | null;
  student: { id: string; firstName: string; lastName: string } | null;
  tutor: { id: string; firstName: string; lastName: string; user?: { timezone: string } };
  consultant: { id: string; firstName: string; lastName: string };
  subject: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDemoBookingPayload {
  demoRequestId?: string;
  studentId?: string;
  tutorId: string;
  subjectId: string;
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  meetingLink?: string;
  meetingPassword?: string;
  parentNotes?: string;
  consultantNotes?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Admin methods
export const adminDemoBookingService = {
  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: DemoBooking[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const { data } = await api.get(`/demo-bookings/admin?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },
};

// Consultant methods
export const consultantDemoBookingService = {
  async create(payload: CreateDemoBookingPayload): Promise<DemoBooking> {
    const { data } = await api.post('/demo-bookings', payload);
    return data.data;
  },

  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: DemoBooking[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const { data } = await api.get(`/demo-bookings/consultant?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async update(id: string, payload: Partial<Pick<CreateDemoBookingPayload, 'scheduledDate' | 'scheduledStart' | 'scheduledEnd' | 'meetingLink' | 'meetingPassword' | 'consultantNotes'>>): Promise<DemoBooking> {
    const { data } = await api.patch(`/demo-bookings/${id}`, payload);
    return data.data;
  },

  async updateStatus(id: string, status: string): Promise<DemoBooking> {
    const { data } = await api.patch(`/demo-bookings/${id}/status`, { status });
    return data.data;
  },
};

// Tutor methods
export const tutorDemoBookingService = {
  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: DemoBooking[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const { data } = await api.get(`/demo-bookings/tutor?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<DemoBooking> {
    const { data } = await api.get(`/demo-bookings/${id}`);
    return data.data;
  },
};

// Parent methods
export const parentDemoBookingService = {
  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: DemoBooking[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const { data } = await api.get(`/demo-bookings/my?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },
};
