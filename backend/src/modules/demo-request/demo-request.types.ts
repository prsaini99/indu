import { DemoRequestStatus, TimeSlotPreference } from '@prisma/client';

export interface CreateDemoRequestDTO {
  contactEmail: string;
  contactPhone: string;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth?: string;
  boardId: string;
  gradeId: string;
  subjectIds: string[];
  preferredTimeSlot: TimeSlotPreference;
  preferredDate: string; // ISO date
  alternativeDate?: string;
  notes?: string;
}

export interface PublicCreateDemoRequestDTO extends CreateDemoRequestDTO {
  parentName: string;
}

export interface UpdateDemoRequestStatusDTO {
  status: DemoRequestStatus;
}

export interface DemoRequestQueryDTO {
  page?: string;
  limit?: string;
  status?: DemoRequestStatus;
}
