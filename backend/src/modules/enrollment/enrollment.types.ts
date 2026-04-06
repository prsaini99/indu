import { EnrollmentStatus, SessionStatus } from '@prisma/client';

export interface ScheduleSlot {
  dayOfWeek: number;  // 0=Sun ... 6=Sat
  startTime: string;  // "HH:mm"
}

export interface CreateEnrollmentDTO {
  studentId: string;
  subjectId: string;
  schedule: ScheduleSlot[];
  duration: number;          // minutes: 45, 60, or 90
  zoomLink?: string;
  zoomPassword?: string;
}

export interface EnrollmentQueryDTO {
  page?: string;
  limit?: string;
  status?: EnrollmentStatus;
}

export interface SessionQueryDTO {
  page?: string;
  limit?: string;
  status?: SessionStatus;
}

export interface CancelSessionDTO {
  reason?: string;
}

export interface ReassignTutorDTO {
  tutorId: string;
}
