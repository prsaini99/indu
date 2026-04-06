import { Permission, Role } from '@prisma/client';

export interface UpdateParentProfileDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface CreateChildDTO {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gradeId: string;
  subjectIds?: string[];
  notes?: string;
}

export interface UpdateChildDTO {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gradeId?: string;
  subjectIds?: string[];
  notes?: string;
}

export interface CreateUserDTO {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  permissions?: Permission[];
}

export interface UpdateUserStatusDTO {
  isActive: boolean;
}

export interface SetPermissionsDTO {
  permissions: Permission[];
}

export interface UpdateConsultantProfileDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}
