// ==========================================
// M3: TUTOR MANAGEMENT DTOs
// ==========================================

export interface UpdateTutorProfileDTO {
  bio?: string;
  phone?: string;
  profilePhotoUrl?: string;
  experience?: number;
}

export interface CreateCertificationDTO {
  title: string;
  institution?: string;
  year?: number;
  documentUrl: string;
}

export interface AdminUpdateTutorDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  experience?: number;
  profilePhotoUrl?: string;
}

export interface AdminAssignCourseDTO {
  courseId: string;
  tutorRate: number; // in fils
}

// ==========================================
// M5: AVAILABILITY DTOs
// ==========================================

export interface CreateAvailabilityTemplateDTO {
  dayOfWeek: number; // 0-6
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface CreateBlockedDateDTO {
  date: string;   // "YYYY-MM-DD"
  reason?: string;
}

// ==========================================
// QUERY TYPES
// ==========================================

export interface TutorSearchQuery {
  page?: string;
  limit?: string;
  subject?: string;
  grade?: string;
  search?: string;
  sort?: 'experience' | 'rate' | 'name';
}

export interface AvailabilityQuery {
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
}

// ==========================================
// COMPUTED TYPES
// ==========================================

export interface ComputedSlot {
  date: string;      // "YYYY-MM-DD"
  dayName: string;
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}
