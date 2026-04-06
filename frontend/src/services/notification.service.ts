import api from './api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  emailSent: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const notificationService = {
  async getMyNotifications(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}): Promise<{ notifications: Notification[]; unreadCount: number; meta: PaginationMeta }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.unreadOnly) q.set('unreadOnly', 'true');
    const { data } = await api.get(`/notifications/my?${q}`);
    return { notifications: data.data.notifications, unreadCount: data.data.unreadCount, meta: data.meta };
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get('/notifications/unread-count');
    return data.data.unreadCount;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
