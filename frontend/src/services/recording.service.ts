import api from './api';

export interface RecordingFileInfo {
  id: string;
  type: string;
  recordingType: string;
  durationSeconds: number | null;
  url: string;
}

export interface RecordingInfo {
  recordingId: string;
  meetingTopic: string | null;
  meetingDuration: number | null;
  files: RecordingFileInfo[];
}

export interface RecordingListItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
  meetingDuration: number | null;
  createdAt: string;
  hasVideo: boolean;
  session: {
    id: string;
    scheduledDate: string;
    scheduledStart: string;
    scheduledEnd: string;
  } | null;
  enrollment: {
    classType: string;
    duration: number;
    subject: { name: string };
    tutor?: { firstName: string; lastName: string };
    student: { id: string; firstName: string; lastName: string };
  } | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const recordingService = {
  async getSessionRecordingUrl(sessionId: string): Promise<RecordingInfo> {
    const { data } = await api.get(`/recordings/session/${sessionId}/url`);
    return data.data;
  },

  async getDemoRecordingUrl(demoBookingId: string): Promise<RecordingInfo> {
    const { data } = await api.get(`/recordings/demo/${demoBookingId}/url`);
    return data.data;
  },

  async getMyRecordings(params: { page?: number; limit?: number; childId?: string; classType?: string } = {}): Promise<{ data: RecordingListItem[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.childId) query.set('childId', params.childId);
    if (params.classType) query.set('classType', params.classType);
    const { data } = await api.get(`/recordings/my?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },

  async getTutorRecordings(params: { page?: number; limit?: number; classType?: string } = {}): Promise<{ data: RecordingListItem[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.classType) query.set('classType', params.classType);
    const { data } = await api.get(`/recordings/tutor/my?${query.toString()}`);
    return { data: data.data, meta: data.meta };
  },
};
