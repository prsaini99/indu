import { DemoBookingStatus } from '@prisma/client';

export interface CreateDemoBookingDTO {
  demoRequestId?: string;
  studentId?: string;
  tutorId: string;
  subjectId: string;
  scheduledDate: string; // ISO date
  scheduledStart: string; // "HH:mm"
  scheduledEnd: string; // "HH:mm"
  meetingLink?: string;
  meetingPassword?: string;
  parentNotes?: string;
  consultantNotes?: string;
}

export interface UpdateDemoBookingDTO {
  scheduledDate?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  meetingLink?: string;
  meetingPassword?: string;
  consultantNotes?: string;
}

export interface UpdateDemoBookingStatusDTO {
  status: DemoBookingStatus;
}

export interface DemoBookingQueryDTO {
  page?: string;
  limit?: string;
  status?: DemoBookingStatus;
}
