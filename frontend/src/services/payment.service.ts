import api from './api';

export interface Payment {
  id: string;
  packageName: string;
  credits: number;
  amountInFils: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  completedAt: string | null;
  createdAt: string;
}

export interface AdminPayment extends Payment {
  parentName: string;
  parentEmail: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Parent payment actions
export const paymentService = {
  async createCheckout(packageId: string): Promise<{ checkoutUrl: string }> {
    const { data } = await api.post('/payments/checkout', { packageId });
    return data.data;
  },

  async getMyPayments(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: Payment[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const { data } = await api.get(`/payments/my?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },
};

// Admin payment views
export const adminPaymentService = {
  async listPayments(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ data: AdminPayment[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const { data } = await api.get(`/admin/payments?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },
};
