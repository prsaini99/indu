import api from './api';

// ── Types ──────────────────────────────────────────────

export interface TutorEarning {
  id: string;
  bookingId: string;
  subject: string;
  studentName: string;
  classDate: string;
  amountInPaise: number;
  status: 'UNPAID' | 'PAID';
  paidAt: string | null;
  createdAt: string;
}

export interface EarningSummary {
  totalEarnedInPaise: number;
  unpaidInPaise: number;
  paidInPaise: number;
  totalClasses: number;
  thisMonth: {
    earnedInPaise: number;
    classes: number;
  };
}

export interface AdminEarningSummary {
  totalEarnedInPaise: number;
  unpaidInPaise: number;
  paidInPaise: number;
  totalRecords: number;
  thisMonthEarnedInPaise: number;
}

export interface PayoutRecord {
  id: string;
  tutorId: string;
  tutorName: string;
  totalAmountInPaise: number;
  earningsCount: number;
  paidVia: string | null;
  referenceNo: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreatePayoutPayload {
  tutorId: string;
  earningIds: string[];
  paidVia?: string;
  referenceNo?: string;
  notes?: string;
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
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  return q.toString();
}

// ── Tutor Earnings Service ─────────────────────────────

export const tutorEarningService = {
  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: TutorEarning[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/tutors/earnings?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async getSummary(): Promise<EarningSummary> {
    const { data } = await api.get('/tutors/earnings/summary');
    return data.data;
  },
};

// ── Admin Earnings Service ─────────────────────────────

export const adminEarningService = {
  async list(params: { page?: number; limit?: number; status?: string; tutorId?: string } = {}): Promise<{ data: (TutorEarning & { tutorName: string; tutorId: string })[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/admin/earnings?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async getSummary(): Promise<AdminEarningSummary> {
    const { data } = await api.get('/admin/earnings/summary');
    return data.data;
  },

  async exportCsv(params: { status?: string; tutorId?: string } = {}): Promise<Blob> {
    const { data } = await api.get(`/admin/earnings/export?${buildQuery(params)}`, {
      responseType: 'blob',
    });
    return data;
  },

  async createPayout(payload: CreatePayoutPayload): Promise<{ id: string; totalAmountInPaise: number; earningsMarkedPaid: number }> {
    const { data } = await api.post('/admin/payouts', payload);
    return data.data;
  },

  async listPayouts(params: { page?: number; limit?: number; tutorId?: string } = {}): Promise<{ data: PayoutRecord[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/admin/payouts?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },
};
