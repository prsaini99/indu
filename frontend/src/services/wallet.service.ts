import api from './api';

export interface WalletBalance {
  parentId: string;
  balance: number;
  totalPurchased: number;
  totalDeducted: number;
  totalAdjusted: number;
}

export interface CreditTransaction {
  id: string;
  type: 'PURCHASE' | 'DEDUCTION' | 'ADMIN_ADJUSTMENT';
  amount: number;
  description: string | null;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInFils: number;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminWalletEntry {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  balance: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Parent wallet
export const walletService = {
  async getBalance(): Promise<WalletBalance> {
    const { data } = await api.get('/wallet/balance');
    return data.data;
  },

  async getTransactions(params: { page?: number; limit?: number; type?: string } = {}): Promise<{ data: CreditTransaction[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.type) query.set('type', params.type);
    const { data } = await api.get(`/wallet/transactions?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },
};

// Public credit packages
export const creditPackageService = {
  async listActive(): Promise<CreditPackage[]> {
    const { data } = await api.get('/credit-packages');
    return data.data;
  },
};

// Admin wallet management
export const adminWalletService = {
  // Credit packages
  async listAllPackages(): Promise<CreditPackage[]> {
    const { data } = await api.get('/admin/credit-packages');
    return data.data;
  },

  async createPackage(payload: { name: string; credits: number; priceInFils: number }): Promise<CreditPackage> {
    const { data } = await api.post('/admin/credit-packages', payload);
    return data.data;
  },

  async updatePackage(id: string, payload: { name?: string; credits?: number; priceInFils?: number; isActive?: boolean }): Promise<CreditPackage> {
    const { data } = await api.patch(`/admin/credit-packages/${id}`, payload);
    return data.data;
  },

  async deactivatePackage(id: string): Promise<CreditPackage> {
    const { data } = await api.patch(`/admin/credit-packages/${id}/deactivate`);
    return data.data;
  },

  async deletePackage(id: string): Promise<void> {
    await api.delete(`/admin/credit-packages/${id}`);
  },

  // Wallet management
  async listAllWallets(params: { page?: number; limit?: number; search?: string } = {}): Promise<{ data: AdminWalletEntry[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    const { data } = await api.get(`/admin/wallets?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async adjustCredits(parentId: string, payload: { amount: number; description: string }): Promise<void> {
    await api.post(`/admin/wallets/${parentId}/adjust`, payload);
  },
};
