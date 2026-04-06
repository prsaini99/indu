import api from './api';

// ── Types ──────────────────────────────────────────────

export interface AssessmentResult {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  remarks: string | null;
  assessedAt: string;
  studentName?: string;
  tutorName?: string;
  subject: string;
  documentsCount?: number;
  createdAt: string;
}

export interface AssessmentResultDetail extends AssessmentResult {
  documents: AssessmentDocument[];
}

export interface AssessmentDocument {
  id: string;
  title: string;
  fileType: string;
  fileSizeKb: number | null;
  createdAt: string;
}

export interface CreateAssessmentPayload {
  studentId: string;
  subjectId: string;
  enrollmentId?: string;
  title: string;
  score: number;
  maxScore?: number;
  remarks?: string;
  assessedAt: string;
}

export interface UpdateAssessmentPayload {
  title?: string;
  score?: number;
  maxScore?: number;
  remarks?: string;
  assessedAt?: string;
}

export interface ProgressSubject {
  subjectId: string;
  subjectName: string;
  totalAssessments: number;
  averagePercentage: number;
  latestPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
  dataPoints: {
    date: string;
    title: string;
    score: number;
    maxScore: number;
    percentage: number;
  }[];
}

export interface ChildProgress {
  subjects: ProgressSubject[];
  overallAverage: number;
  totalAssessments: number;
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

// ── Tutor Assessment Service ───────────────────────────

export interface TutorStudent {
  id: string;
  firstName: string;
  lastName: string;
  subjects: { id: string; name: string }[];
}

export const tutorAssessmentService = {
  async getMyStudents(): Promise<TutorStudent[]> {
    const { data } = await api.get('/assessment-results/my-students');
    return data.data;
  },

  async create(payload: CreateAssessmentPayload): Promise<AssessmentResult> {
    const { data } = await api.post('/assessment-results', payload);
    return data.data;
  },

  async list(params: { page?: number; limit?: number; studentId?: string; subjectId?: string } = {}): Promise<{ data: AssessmentResult[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/assessment-results?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<AssessmentResultDetail> {
    const { data } = await api.get(`/assessment-results/${id}`);
    return data.data;
  },

  async update(id: string, payload: UpdateAssessmentPayload): Promise<AssessmentResult> {
    const { data } = await api.patch(`/assessment-results/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/assessment-results/${id}`);
  },

  async uploadDocument(id: string, payload: { title: string; fileType: string }): Promise<{ documentId: string; uploadUrl: string | null; fileKey: string }> {
    const { data } = await api.post(`/assessment-results/${id}/documents`, payload);
    return data.data;
  },

  async deleteDocument(id: string, docId: string): Promise<void> {
    await api.delete(`/assessment-results/${id}/documents/${docId}`);
  },
};

// ── Parent Assessment Service ──────────────────────────

export const parentAssessmentService = {
  async getChildResults(childId: string, params: { page?: number; limit?: number; subjectId?: string } = {}): Promise<{ data: AssessmentResult[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/parents/children/${childId}/assessment-results?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },

  async getChildProgress(childId: string, params: { subjectId?: string } = {}): Promise<ChildProgress> {
    const { data } = await api.get(`/parents/children/${childId}/progress?${buildQuery(params)}`);
    return data.data;
  },

  async getById(id: string): Promise<AssessmentResultDetail> {
    const { data } = await api.get(`/assessment-results/${id}`);
    return data.data;
  },

  async downloadDocument(id: string, docId: string): Promise<{ downloadUrl: string | null; title: string; fileType: string }> {
    const { data } = await api.get(`/assessment-results/${id}/documents/${docId}/download`);
    return data.data;
  },
};

// ── Admin Assessment Service ───────────────────────────

export const adminAssessmentService = {
  async list(params: { page?: number; limit?: number; studentId?: string; subjectId?: string } = {}): Promise<{ data: AssessmentResult[]; meta: PaginationMeta }> {
    const { data } = await api.get(`/admin/assessment-results?${buildQuery(params)}`);
    return { data: data.data, meta: data.meta };
  },
};
