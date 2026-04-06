import api from './api';

export interface Course {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  subject: { id: string; name: string };
  grade: { id: string; name: string; tier: { id: string; name: string; creditsPerClass: number } };
  tutors?: { id: string; firstName: string; lastName: string }[];
  materials?: CourseMaterial[];
  createdAt: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSizeKb: number | null;
  createdAt: string;
}

export interface GradeTier {
  id: string;
  name: string;
  creditsPerClass: number;
  credits60Min: number;
  credits90Min: number;
  credits120Min: number;
  minGrade: number;
  maxGrade: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Public course browsing
export const courseService = {
  async list(params: { page?: number; limit?: number; subjectId?: string; gradeId?: string; search?: string } = {}): Promise<{ data: Course[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.subjectId) query.set('subject', params.subjectId);
    if (params.gradeId) query.set('grade', params.gradeId);
    if (params.search) query.set('search', params.search);
    const { data } = await api.get(`/courses?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async getById(id: string): Promise<Course> {
    const { data } = await api.get(`/courses/${id}`);
    return data.data;
  },
};

// Tutor: own assigned courses & materials
export const tutorCourseService = {
  async listMyCourses(): Promise<Course[]> {
    const { data } = await api.get('/tutors/my-courses');
    return data.data;
  },

  async addMaterial(courseId: string, payload: { title: string; fileUrl: string; fileType: string; fileSizeKb?: number }): Promise<CourseMaterial> {
    const { data } = await api.post(`/tutors/courses/${courseId}/materials`, payload);
    return data.data;
  },

  async removeMaterial(courseId: string, materialId: string): Promise<void> {
    await api.delete(`/tutors/courses/${courseId}/materials/${materialId}`);
  },
};

// Admin course management
export const adminCourseService = {
  async list(params: { page?: number; limit?: number; subjectId?: string; gradeId?: string; search?: string } = {}): Promise<{ data: Course[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.subjectId) query.set('subject', params.subjectId);
    if (params.gradeId) query.set('grade', params.gradeId);
    if (params.search) query.set('search', params.search);
    const { data } = await api.get(`/admin/courses?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async create(payload: { subjectId: string; gradeId: string; name: string; description?: string }): Promise<Course> {
    const { data } = await api.post('/admin/courses', payload);
    return data.data;
  },

  async update(id: string, payload: { name?: string; description?: string; isActive?: boolean }): Promise<Course> {
    const { data } = await api.patch(`/admin/courses/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/courses/${id}`);
  },

  // Materials
  async addMaterial(courseId: string, payload: { title: string; fileUrl: string; fileType: string; fileSizeKb?: number }): Promise<CourseMaterial> {
    const { data } = await api.post(`/admin/courses/${courseId}/materials`, payload);
    return data.data;
  },

  async removeMaterial(courseId: string, materialId: string): Promise<void> {
    await api.delete(`/admin/courses/${courseId}/materials/${materialId}`);
  },

  // Tutor assignment
  async assignTutor(courseId: string, tutorId: string, tutorRate: number): Promise<void> {
    await api.post(`/admin/courses/${courseId}/tutors`, { tutorId, tutorRate });
  },

  async removeTutor(courseId: string, tutorId: string): Promise<void> {
    await api.delete(`/admin/courses/${courseId}/tutors/${tutorId}`);
  },

  // Grade tiers
  async listGradeTiers(): Promise<GradeTier[]> {
    const { data } = await api.get('/admin/grade-tiers');
    return data.data;
  },

  async updateGradeTier(id: string, payload: { creditsPerClass?: number; credits60Min?: number; credits90Min?: number; credits120Min?: number }): Promise<GradeTier> {
    const { data } = await api.patch(`/admin/grade-tiers/${id}`, payload);
    return data.data;
  },
};
