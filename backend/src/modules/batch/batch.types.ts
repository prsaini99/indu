export interface ScheduleSlot {
  dayOfWeek: number; // 0=Sun ... 6=Sat
  startTime: string; // "HH:mm"
}

export interface CreateBatchDTO {
  name: string;
  description?: string;
  subjectId: string;
  tutorId: string;
  gradeId: string;
  schedule: ScheduleSlot[];
  duration: number;
  minStudents?: number;
  maxStudents?: number;
  creditsPerSession: number;
  startDate?: string;
}

export interface UpdateBatchDTO {
  name?: string;
  description?: string;
  tutorId?: string;
  schedule?: ScheduleSlot[];
  duration?: number;
  minStudents?: number;
  maxStudents?: number;
  creditsPerSession?: number;
  startDate?: string;
}

export interface JoinBatchDTO {
  studentId: string;
}

export interface BatchQueryDTO {
  page?: string;
  limit?: string;
  status?: string;
  subjectId?: string;
  gradeId?: string;
}
