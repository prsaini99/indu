import api from './api';

export interface ParentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  children: ChildProfile[];
  walletBalance: number;
}

export interface ChildProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  grade: { id: string; name: string };
  subjects: { id: string; name: string }[];
  notes: string | null;
}

export interface GradeLevel {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Subject {
  id: string;
  name: string;
}

export const userService = {
  // Parent profile
  async getParentProfile(): Promise<ParentProfile> {
    const { data } = await api.get('/parents/profile');
    return data.data;
  },

  async updateParentProfile(updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  }): Promise<void> {
    await api.patch('/parents/profile', updates);
  },

  // Children
  async getChildren(): Promise<ChildProfile[]> {
    const { data } = await api.get('/parents/children');
    return data.data;
  },

};

// Consultant profile
export interface ConsultantProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  contactEmail: string | null;
  loginEmail: string;
}

export const consultantService = {
  async getProfile(): Promise<ConsultantProfile> {
    const { data } = await api.get('/consultants/profile');
    return data.data;
  },

  async updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  }): Promise<void> {
    await api.patch('/consultants/profile', updates);
  },
};

// Reference data (grades, subjects)
export interface Board {
  id: string;
  name: string;
}

export const referenceService = {
  async getGrades(): Promise<GradeLevel[]> {
    const { data } = await api.get('/grades');
    return data.data || [];
  },

  async getSubjects(): Promise<Subject[]> {
    const { data } = await api.get('/subjects');
    return data.data || [];
  },

  async getBoards(): Promise<Board[]> {
    const { data } = await api.get('/boards');
    return data.data || [];
  },
};
