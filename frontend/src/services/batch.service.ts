import api from './api';

export type BatchStatus = 'OPEN' | 'FULL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
}

export interface Batch {
  id: string;
  name: string;
  description: string | null;
  status: BatchStatus;
  schedule: ScheduleSlot[];
  duration: number;
  minStudents: number;
  maxStudents: number;
  creditsPerSession: number;
  zoomLink: string | null;
  zoomPassword: string | null;
  startDate: string | null;
  subject: { id: string; name: string };
  tutor: { id: string; firstName: string; lastName: string; bio?: string; profilePhotoUrl?: string; experience?: number; userId?: string };
  grade: { id: string; name: string };
  students?: { student: { id: string; firstName: string; lastName: string }; parent: { id: string; firstName: string; lastName: string; user?: { email: string } } }[];
  sessions?: BatchSession[];
  _count?: { students: number };
  createdAt: string;
}

export interface BatchSession {
  id: string;
  batchId: string;
  status: string;
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Admin
export const adminBatchService = {
  async create(data: {
    name: string;
    description?: string;
    subjectId: string;
    tutorId: string;
    gradeId: string;
    schedule: ScheduleSlot[];
    duration: number;
    minStudents?: number;
    maxStudents?: number;
    creditsPerSession: number;
    startDate?: string;
  }): Promise<Batch> {
    const { data: res } = await api.post('/admin/batches', data);
    return res.data;
  },

  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: Batch[]; meta: PaginationMeta }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    const { data } = await api.get(`/admin/batches?${q}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<Batch> {
    const { data } = await api.get(`/admin/batches/${id}`);
    return data.data;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Batch> {
    const { data } = await api.patch(`/admin/batches/${id}`, payload);
    return data.data;
  },

  async start(id: string): Promise<Batch> {
    const { data } = await api.patch(`/admin/batches/${id}/start`);
    return data.data;
  },

  async cancel(id: string, reason?: string): Promise<Batch> {
    const { data } = await api.patch(`/admin/batches/${id}/cancel`, { reason });
    return data.data;
  },

  async removeStudent(batchId: string, studentId: string): Promise<void> {
    await api.delete(`/admin/batches/${batchId}/students/${studentId}`);
  },
};

// Parent
export const parentBatchService = {
  async listAvailable(params: { page?: number; limit?: number; subjectId?: string; gradeId?: string } = {}): Promise<{ data: Batch[]; meta: PaginationMeta }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.subjectId) q.set('subjectId', params.subjectId);
    if (params.gradeId) q.set('gradeId', params.gradeId);
    const { data } = await api.get(`/batches/available?${q}`);
    return { data: data.data, meta: data.meta };
  },

  async listMy(params: { page?: number; limit?: number } = {}): Promise<{ data: Batch[]; meta: PaginationMeta }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const { data } = await api.get(`/batches/my?${q}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<Batch> {
    const { data } = await api.get(`/batches/${id}`);
    return data.data;
  },

  async join(batchId: string, studentId: string): Promise<{ message: string; spotsRemaining: number }> {
    const { data } = await api.post(`/batches/${batchId}/join`, { studentId });
    return data.data;
  },

  async leave(batchId: string, studentId: string): Promise<void> {
    await api.post(`/batches/${batchId}/leave`, { studentId });
  },

  async getCourseMaterials(batchId: string): Promise<{ courseName: string; materials: { id: string; title: string; fileUrl: string; fileType: string; fileSizeKb: number | null; createdAt: string }[] }> {
    const { data } = await api.get(`/batches/${batchId}/materials`);
    return data.data;
  },
};

// Tutor
export const tutorBatchService = {
  async list(params: { page?: number; limit?: number } = {}): Promise<{ data: Batch[]; meta: PaginationMeta }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const { data } = await api.get(`/batches/tutor?${q}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<Batch> {
    const { data } = await api.get(`/batches/tutor/${id}`);
    return data.data;
  },
};
