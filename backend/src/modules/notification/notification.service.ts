import prisma from '../../config/database';
import { emailTransporter, isEmailConfigured, emailFrom } from '../../config/email';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { baseEmailTemplate } from './templates/base';
import { SendNotificationDTO, NotificationQueryDTO } from './notification.types';

export class NotificationService {
  // ==========================================
  // CORE: Send notification (email + DB)
  // ==========================================

  async send(dto: SendNotificationDTO): Promise<void> {
    let emailSent = false;

    const html = dto.emailHtml || baseEmailTemplate(dto.title, dto.message);

    try {
      if (isEmailConfigured && emailTransporter) {
        await emailTransporter.sendMail({
          from: emailFrom,
          to: dto.userEmail,
          subject: dto.title,
          html,
        });
        emailSent = true;
      } else {
        console.log('─── DEV EMAIL ───');
        console.log(`To: ${dto.userEmail}`);
        console.log(`Subject: ${dto.title}`);
        console.log(`Body: ${dto.message}`);
        console.log('─────────────────');
        emailSent = true;
      }
    } catch (err) {
      console.error('Email send failed:', err);
    }

    await prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        emailSent,
        metadata: dto.metadata as any,
      },
    });
  }

  // ==========================================
  // BULK: Send to multiple users
  // ==========================================

  async sendBulk(notifications: SendNotificationDTO[]): Promise<void> {
    await Promise.allSettled(notifications.map((n) => this.send(n)));
  }

  // ==========================================
  // API: Get my notifications
  // ==========================================

  async getMyNotifications(userId: string, query: NotificationQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: any = { userId };
    if (query.unreadOnly === 'true') where.isRead = false;

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, unreadCount, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // API: Unread count (lightweight for polling)
  // ==========================================

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  // ==========================================
  // API: Mark as read
  // ==========================================

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) return null;

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // ==========================================
  // API: Mark all as read
  // ==========================================

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { markedRead: result.count };
  }
}
