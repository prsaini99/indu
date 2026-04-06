import api from './api';

// ── Types ──────────────────────────────────────────────

export type EnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type SessionStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED_PARENT' | 'CANCELLED_LATE' | 'SKIPPED' | 'NO_SHOW_REPORTED' | 'MISSED_TUTOR';

export interface ScheduleSlot {
  dayOfWeek: number;  // 0=Sun ... 6=Sat
  startTime: string;  // "HH:mm"
}

export interface Enrollment {
  id: string;
  status: EnrollmentStatus;
  schedule: ScheduleSlot[];
  duration: number;
  zoomLink: string | null;
  zoomPassword: string | null;
  creditsPerSession: number;
  pauseReason: string | null;
  cancelReason: string | null;
  lastGeneratedDate: string | null;
  lastPausedAt: string | null;
  lastResumedAt: string | null;
  pauseCountMonth: number;
  pauseCountResetAt: string | null;
  student: { id: string; firstName: string; lastName: string; gradeId?: string };
  parent: { id: string; firstName: string; lastName: string; user?: { timezone: string } };
  subject: { id: string; name: string };
  tutor: { id: string; firstName: string; lastName: string; user?: { email: string; timezone: string } };
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentSession {
  id: string;
  enrollmentId: string;
  status: SessionStatus;
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  creditsCharged: number;
  creditDeductedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface CourseMaterial {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSizeKb: number | null;
  createdAt: string;
}

export interface CourseMaterialsResponse {
  courseName: string;
  materials: CourseMaterial[];
}

export interface CreateEnrollmentPayload {
  studentId: string;
  subjectId: string;
  schedule: ScheduleSlot[];
  duration: number;
  zoomLink?: string;
  zoomPassword?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Helper ─────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) q.set(k, String(v));
  });
  return q.toString();
}

// ── Parent Service ─────────────────────────────────────

export interface AvailableSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  tutorCount: number;
}

export const parentEnrollmentService = {
  async getAvailableSlots(subjectId: string, gradeId: string, duration: number): Promise<{ slots: AvailableSlot[]; message?: string }> {
    const { data } = await api.get(`/enrollments/available-slots?${buildQuery({ subjectId, gradeId, duration })}`);
    return data.data;
  },

  async create(payload: CreateEnrollmentPayload): Promise<Enrollment> {
    const { data } = await api.post('/enrollments', payload);
    return data.data;
  },

  async list(params: { page?: number; limit?: number; status?: EnrollmentStatus } = {}): Promise<{ data: Enrollment[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/enrollments/my?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<Enrollment> {
    const { data } = await api.get(`/enrollments/${id}`);
    return data.data;
  },

  async getSessions(id: string, params: { page?: number; limit?: number; status?: SessionStatus } = {}): Promise<{ data: EnrollmentSession[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/enrollments/${id}/sessions?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async pause(id: string, reason?: string): Promise<Enrollment> {
    const { data } = await api.patch(`/enrollments/${id}/pause`, { reason });
    return data.data;
  },

  async resume(id: string): Promise<Enrollment> {
    const { data } = await api.patch(`/enrollments/${id}/resume`);
    return data.data;
  },

  async cancel(id: string, reason?: string): Promise<Enrollment> {
    const { data } = await api.patch(`/enrollments/${id}/cancel`, { reason });
    return data.data;
  },

  async cancelSession(sessionId: string, reason?: string): Promise<EnrollmentSession> {
    const { data } = await api.patch(`/enrollment-sessions/${sessionId}/cancel`, { reason });
    return data.data;
  },

  async reportNoShow(sessionId: string): Promise<EnrollmentSession> {
    const { data } = await api.patch(`/enrollment-sessions/${sessionId}/report-no-show`);
    return data.data;
  },

  async getCourseMaterials(enrollmentId: string): Promise<CourseMaterialsResponse> {
    const { data } = await api.get(`/enrollments/${enrollmentId}/materials`);
    return data.data;
  },

};

// ── Tutor Service ──────────────────────────────────────

export const tutorEnrollmentService = {
  async list(params: { page?: number; limit?: number; status?: EnrollmentStatus } = {}): Promise<{ data: Enrollment[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/enrollments/tutor?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<Enrollment> {
    const { data } = await api.get(`/enrollments/${id}`);
    return data.data;
  },

  async getSessions(id: string, params: { page?: number; limit?: number; status?: SessionStatus } = {}): Promise<{ data: EnrollmentSession[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/enrollments/tutor/${id}/sessions?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async updateMeetingLink(id: string, zoomLink: string, zoomPassword?: string): Promise<Enrollment> {
    const { data } = await api.patch(`/enrollments/${id}/meeting-link`, { zoomLink, zoomPassword });
    return data.data;
  },
};

// ── Admin Service ──────────────────────────────────────

export const adminEnrollmentService = {
  async list(params: { page?: number; limit?: number; status?: EnrollmentStatus } = {}): Promise<{ data: Enrollment[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/admin/enrollments?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<Enrollment> {
    const { data } = await api.get(`/enrollments/${id}`);
    return data.data;
  },

  async getSessions(id: string, params: { page?: number; limit?: number } = {}): Promise<{ data: EnrollmentSession[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/admin/enrollments/${id}/sessions?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async reassignTutor(id: string, tutorId: string): Promise<Enrollment> {
    const { data } = await api.patch(`/admin/enrollments/${id}/reassign`, { tutorId });
    return data.data;
  },

  async forceCancel(id: string, reason?: string): Promise<Enrollment> {
    const { data } = await api.patch(`/admin/enrollments/${id}/cancel`, { reason });
    return data.data;
  },

  async forcePause(id: string, reason?: string): Promise<Enrollment> {
    const { data } = await api.patch(`/admin/enrollments/${id}/pause`, { reason });
    return data.data;
  },

  async forceResume(id: string): Promise<Enrollment> {
    const { data } = await api.patch(`/admin/enrollments/${id}/resume`);
    return data.data;
  },

  async listTutorsForReassign(id: string): Promise<{ id: string; firstName: string; lastName: string }[]> {
    const { data } = await api.get(`/admin/enrollments/${id}/tutors`);
    return data.data;
  },

  async reviewNoShow(sessionId: string, decision: 'APPROVE' | 'REJECT', notes?: string): Promise<EnrollmentSession> {
    const { data } = await api.patch(`/admin/enrollment-sessions/${sessionId}/review-no-show`, { decision, notes });
    return data.data;
  },
};
