import cron from 'node-cron';
import prisma from '../config/database';
import { NotificationService } from '../modules/notification/notification.service';
import { sessionReminderParent, sessionReminderTutor } from '../modules/notification/templates/event-templates';

const notificationService = new NotificationService();

export function startNotificationCron() {
  // Daily at 08:00 UTC — send 24hr session reminders for tomorrow's classes
  cron.schedule('0 8 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const tomorrowDate = new Date(tomorrowStr + 'T12:00:00Z');

      let count = 0;

      // 1. Enrollment sessions
      const enrollmentSessions = await prisma.enrollmentSession.findMany({
        where: {
          scheduledDate: tomorrowDate,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        include: {
          enrollment: {
            include: {
              student: { select: { firstName: true, lastName: true } },
              subject: { select: { name: true } },
              parent: { include: { user: { select: { id: true, email: true } } } },
              tutor: { include: { user: { select: { id: true, email: true } } } },
            },
          },
        },
      });

      for (const session of enrollmentSessions) {
        const e = session.enrollment;
        const studentName = `${e.student.firstName} ${e.student.lastName}`;
        const pTemplate = sessionReminderParent(studentName, e.subject.name, tomorrowStr, session.scheduledStart);
        const tTemplate = sessionReminderTutor(studentName, e.subject.name, tomorrowStr, session.scheduledStart);

        await notificationService.sendBulk([
          { userId: e.parent.user.id, userEmail: e.parent.user.email, type: 'SESSION_REMINDER', ...pTemplate, emailHtml: pTemplate.html },
          { userId: e.tutor.user.id, userEmail: e.tutor.user.email, type: 'SESSION_REMINDER', ...tTemplate, emailHtml: tTemplate.html },
        ]);
        count++;
      }

      // 2. Batch sessions
      const batchSessions = await prisma.batchSession.findMany({
        where: {
          scheduledDate: tomorrowDate,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        include: {
          batch: {
            include: {
              subject: { select: { name: true } },
              tutor: { include: { user: { select: { id: true, email: true } } } },
              students: {
                where: { isActive: true },
                include: {
                  student: { select: { firstName: true, lastName: true } },
                  parent: { include: { user: { select: { id: true, email: true } } } },
                },
              },
            },
          },
        },
      });

      for (const session of batchSessions) {
        const b = session.batch;
        const notifications = [];

        // Tutor reminder
        const tTemplate = sessionReminderTutor('Group Class', b.subject.name, tomorrowStr, session.scheduledStart);
        notifications.push({
          userId: b.tutor.user.id,
          userEmail: b.tutor.user.email,
          type: 'SESSION_REMINDER' as const,
          ...tTemplate,
          emailHtml: tTemplate.html,
        });

        // Each parent reminder
        for (const bs of b.students) {
          const studentName = `${bs.student.firstName} ${bs.student.lastName}`;
          const pTemplate = sessionReminderParent(studentName, b.subject.name, tomorrowStr, session.scheduledStart);
          notifications.push({
            userId: bs.parent.user.id,
            userEmail: bs.parent.user.email,
            type: 'SESSION_REMINDER' as const,
            ...pTemplate,
            emailHtml: pTemplate.html,
          });
        }

        await notificationService.sendBulk(notifications);
        count++;
      }

      if (count > 0) console.log(`[CRON] Sent reminders for ${count} session(s)`);
    } catch (err) {
      console.error('[CRON] Session reminder failed:', err);
    }
  });

  console.log('[CRON] Notification cron scheduled (reminders daily 08:00 UTC)');
}
