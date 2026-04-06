import { ApplicationRole, ApplicationStatus } from '@prisma/client';

export interface CreateApplicationDTO {
  role: ApplicationRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience?: number;
  bio?: string;
  resumeUrl?: string;
  subjects?: string;
  qualifications?: string;
}

export interface ReviewApplicationDTO {
  status: 'APPROVED' | 'REJECTED';
  reviewNote?: string;
}

export interface ApplicationQueryDTO {
  page?: string;
  limit?: string;
  status?: ApplicationStatus;
  role?: ApplicationRole;
}
