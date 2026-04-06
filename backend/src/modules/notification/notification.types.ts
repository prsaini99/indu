import { NotificationType } from '@prisma/client';

export interface SendNotificationDTO {
  userId: string;
  userEmail: string;
  type: NotificationType;
  title: string;
  message: string;
  emailHtml?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationQueryDTO {
  page?: string;
  limit?: string;
  unreadOnly?: string;
}
