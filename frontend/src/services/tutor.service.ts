import api from './api';

// ==========================================
// TYPES
// ==========================================

export interface TutorCourseInfo {
  id: string;
  name: string;
  subject: { id: string; name: string };
  grade: { id: string; name: string };
  tutorRate: number;
}

export interface TutorSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  bio: string | null;
  experience: number;
  rating: number | null;
  totalReviews: number;
  courses: TutorCourseInfo[];
}

export interface TutorPublicProfile extends TutorSearchResult {
  introVideoUrl: string | null;
  certifications: { id: string; title: string; institution: string | null; year: number | null }[];
}

export interface TutorOwnCourse {
  id: string;
  courseId: string;
  courseName: string;
  subject: { id: string; name: string };
  grade: { id: string; name: string };
  tutorRate: number;
}

export interface TutorOwnProfile {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  experience: number;
  profilePhotoUrl: string | null;
  introVideoUrl: string | null;
  isActive: boolean;
  courses: TutorOwnCourse[];
  certifications: TutorCertification[];
  lastLoginAt: string | null;
}

export interface TutorCertification {
  id: string;
  title: string;
  institution: string | null;
  year: number | null;
  documentUrl: string;
  createdAt: string;
}

export interface TutorDashboardSummary {
  totalStudents: number;
  upcomingSessions: number;
  completedSessions: number;
  totalEarnings: number;
  averageRating: number | null;
  coursesCount: number;
}

export interface AvailabilityTemplate {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

export interface ComputedSlot {
  date: string;
  dayName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminTutor {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  experience: number;
  profilePhotoUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  certificationsCount: number;
  courses: TutorCourseInfo[];
}

// ==========================================
// PUBLIC TUTOR DIRECTORY
// ==========================================

export const tutorSearchService = {
  async search(params: { page?: number; limit?: number; subject?: string; grade?: string; search?: string; sort?: string } = {}): Promise<{ data: TutorSearchResult[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.subject) query.set('subject', params.subject);
    if (params.grade) query.set('grade', params.grade);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);
    const { data } = await api.get(`/tutors?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async getPublicProfile(tutorId: string): Promise<TutorPublicProfile> {
    const { data } = await api.get(`/tutors/${tutorId}`);
    return data.data;
  },

  async getAvailability(tutorId: string, date: string): Promise<{
    slots: Array<{ date: string; startTime: string; endTime: string; dayName: string }>;
    blockedDates: Array<{ date: string; reason: string | null }>;
    tutorTimezone: string;
  }> {
    const { data } = await api.get(`/tutors/${tutorId}/availability?startDate=${date}&endDate=${date}`);
    return data.data;
  },
};

// ==========================================
// TUTOR SELF-MANAGEMENT
// ==========================================

export const tutorService = {
  async getProfile(): Promise<TutorOwnProfile> {
    const { data } = await api.get('/tutors/profile');
    return data.data;
  },

  async updateProfile(payload: { bio?: string; phone?: string; experience?: number; profilePhotoUrl?: string }): Promise<void> {
    await api.patch('/tutors/profile', payload);
  },

  async getDashboard(): Promise<TutorDashboardSummary> {
    const { data } = await api.get('/tutors/dashboard');
    return data.data;
  },

  // Certifications
  async getCertifications(): Promise<TutorCertification[]> {
    const { data } = await api.get('/tutors/certifications');
    return data.data;
  },

  async addCertification(payload: { title: string; institution?: string; year?: number; documentUrl: string }): Promise<TutorCertification> {
    const { data } = await api.post('/tutors/certifications', payload);
    return data.data;
  },

  async deleteCertification(id: string): Promise<void> {
    await api.delete(`/tutors/certifications/${id}`);
  },

  // M5: Availability templates
  async getTemplates(): Promise<AvailabilityTemplate[]> {
    const { data } = await api.get('/tutors/availability/templates');
    return data.data;
  },

  async createTemplate(payload: { dayOfWeek: number; startTime: string; endTime: string }): Promise<AvailabilityTemplate> {
    const { data } = await api.post('/tutors/availability/templates', payload);
    return data.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/tutors/availability/templates/${id}`);
  },

  // M5: Blocked dates
  async getBlockedDates(): Promise<BlockedDate[]> {
    const { data } = await api.get('/tutors/availability/blocked-dates');
    return data.data;
  },

  async createBlockedDate(payload: { date: string; reason?: string }): Promise<BlockedDate> {
    const { data } = await api.post('/tutors/availability/blocked-dates', payload);
    return data.data;
  },

  async deleteBlockedDate(id: string): Promise<void> {
    await api.delete(`/tutors/availability/blocked-dates/${id}`);
  },

  // M5: Compute availability
  async getAvailability(tutorId: string, startDate: string, endDate: string): Promise<ComputedSlot[]> {
    const { data } = await api.get(`/tutors/${tutorId}/availability?startDate=${startDate}&endDate=${endDate}`);
    return data.data;
  },
};

// ==========================================
// ADMIN TUTOR MANAGEMENT
// ==========================================

export const adminTutorService = {
  async listTutors(params: { page?: number; limit?: number; search?: string; subject?: string } = {}): Promise<{ data: AdminTutor[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.subject) query.set('subject', params.subject);
    const { data } = await api.get(`/admin/tutors?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async updateTutor(tutorId: string, payload: { firstName?: string; lastName?: string; phone?: string; bio?: string; experience?: number }): Promise<void> {
    await api.patch(`/admin/tutors/${tutorId}`, payload);
  },

  async toggleStatus(tutorId: string, isActive: boolean): Promise<void> {
    await api.patch(`/admin/tutors/${tutorId}/status`, { isActive });
  },

  async deleteTutor(tutorId: string): Promise<void> {
    await api.delete(`/admin/tutors/${tutorId}`);
  },

  async getPerformance(tutorId: string): Promise<{ totalSessions: number; completedSessions: number; cancelledSessions: number; averageRating: number | null; totalEarnings: number }> {
    const { data } = await api.get(`/admin/tutors/${tutorId}/performance`);
    return data.data;
  },

  async assignCourse(tutorId: string, courseId: string, tutorRate: number): Promise<void> {
    await api.post(`/admin/tutors/${tutorId}/courses`, { courseId, tutorRate });
  },

  async removeCourse(tutorId: string, courseId: string): Promise<void> {
    await api.delete(`/admin/tutors/${tutorId}/courses/${courseId}`);
  },
};
