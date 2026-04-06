import api from './api';

// ── Types ──────────────────────────────────────────────

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  tutorName?: string;
  parentName?: string;
  subject: string;
  classDate?: string;
  isVisible?: boolean;
  createdAt: string;
}

export interface TutorReviewsResponse {
  tutorId: string;
  aggregateRating: number | null;
  totalReviews: number;
  distribution: Record<number, number>;
  reviews: Review[];
  meta: PaginationMeta;
}

export interface CreateReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
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

// ── Parent Review Service ──────────────────────────────

export const parentReviewService = {
  async create(payload: CreateReviewPayload): Promise<Review> {
    const { data } = await api.post('/reviews', payload);
    return data.data;
  },

  async listMyReviews(params: { page?: number; limit?: number } = {}): Promise<{ data: Review[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/reviews/my-reviews?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },
};

// ── Public Review Service ──────────────────────────────

export const publicReviewService = {
  async getTutorReviews(tutorId: string, params: { page?: number; limit?: number } = {}): Promise<TutorReviewsResponse> {
    const { data } = await api.get(`/tutors/${tutorId}/reviews?${buildQuery(params)}`);
    return data.data;
  },
};

// ── Tutor Review Service ───────────────────────────────

export const tutorReviewService = {
  async listOwnReviews(params: { page?: number; limit?: number } = {}): Promise<TutorReviewsResponse> {
    const { data } = await api.get(`/tutors/reviews?${buildQuery(params)}`);
    return data.data;
  },
};

// ── Admin Review Service ───────────────────────────────

export const adminReviewService = {
  async list(params: { page?: number; limit?: number; tutorId?: string; isVisible?: string } = {}): Promise<{ data: Review[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/admin/reviews?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async updateVisibility(id: string, isVisible: boolean): Promise<{ id: string; isVisible: boolean }> {
    const { data } = await api.patch(`/admin/reviews/${id}/visibility`, { isVisible });
    return data.data;
  },
};
