import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';

export class DashboardService {
  // ==========================================
  // PARENT DASHBOARD
  // ==========================================

  async getParentDashboard(userId: string) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const now = new Date();

    const [
      children,
      creditTxns,
      activeEnrollments,
      activeBatchStudents,
      upcomingDemoBookings,
      upcomingSessions,
      assessmentCount,
      recentAssessments,
      unreadNotifications,
    ] = await Promise.all([
      prisma.student.count({ where: { parentId: parent.id, deletedAt: null } }),

      prisma.creditTransaction.findMany({
        where: { parentId: parent.id },
        select: { type: true, amount: true },
      }),

      prisma.enrollment.count({ where: { parentId: parent.id, status: 'ACTIVE' } }),

      prisma.batchStudent.count({ where: { parentId: parent.id, isActive: true } }),

      prisma.demoBooking.count({
        where: {
          student: { parentId: parent.id },
          status: 'CONFIRMED',
          scheduledDate: { gte: now },
        },
      }),

      prisma.enrollmentSession.findMany({
        where: {
          enrollment: { parentId: parent.id },
          status: { in: ['CONFIRMED', 'SCHEDULED'] },
          scheduledDate: { gte: now },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 5,
        include: {
          enrollment: {
            select: {
              subject: { select: { name: true } },
              tutor: { select: { firstName: true, lastName: true } },
              classType: true,
            },
          },
        },
      }),

      prisma.assessmentResult.count({
        where: { student: { parentId: parent.id } },
      }),

      prisma.assessmentResult.findMany({
        where: { student: { parentId: parent.id } },
        orderBy: { assessedAt: 'desc' },
        take: 3,
        select: { title: true, score: true, maxScore: true, percentage: true, assessedAt: true, subject: { select: { name: true } } },
      }),

      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    // Compute balance
    let creditBalance = 0;
    for (const tx of creditTxns) {
      if (tx.type === 'DEDUCTION') creditBalance -= tx.amount;
      else creditBalance += tx.amount;
    }

    return {
      childrenCount: children,
      creditBalance,
      activeEnrollments,
      activeBatches: activeBatchStudents,
      upcomingDemos: upcomingDemoBookings,
      assessmentCount,
      upcomingSessions: upcomingSessions.map((s) => ({
        subject: s.enrollment.subject.name,
        tutor: `${s.enrollment.tutor.firstName} ${s.enrollment.tutor.lastName}`,
        date: s.scheduledDate,
        time: s.scheduledStart,
        type: s.enrollment.classType === 'ONE_TO_ONE' ? '1:1' : 'Group',
      })),
      recentAssessments: recentAssessments.map((a) => ({
        title: a.title,
        subject: a.subject.name,
        score: a.score,
        maxScore: a.maxScore,
        percentage: Math.round(a.percentage),
        date: a.assessedAt,
      })),
      notifications: { unreadCount: unreadNotifications },
    };
  }

  // ==========================================
  // TUTOR DASHBOARD
  // ==========================================

  async getTutorDashboard(userId: string) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalStudents,
      upcomingSessionCount,
      completedSessions,
      totalEarnings,
      unpaidEarnings,
      thisMonthEarnings,
      coursesCount,
      avgRating,
      upcomingSessions,
      recentEnrollments,
      recentReviews,
      unreadNotifications,
    ] = await Promise.all([
      prisma.enrollment.count({ where: { tutorId: tutor.id, status: 'ACTIVE' } }),

      prisma.enrollmentSession.count({
        where: { enrollment: { tutorId: tutor.id }, status: { in: ['CONFIRMED', 'SCHEDULED'] }, scheduledDate: { gte: now } },
      }),

      prisma.enrollmentSession.count({ where: { enrollment: { tutorId: tutor.id }, status: 'COMPLETED' } }),

      prisma.tutorEarning.aggregate({ where: { tutorId: tutor.id }, _sum: { amountInPaise: true } }),

      prisma.tutorEarning.aggregate({ where: { tutorId: tutor.id, status: 'UNPAID' }, _sum: { amountInPaise: true } }),

      prisma.tutorEarning.aggregate({ where: { tutorId: tutor.id, createdAt: { gte: startOfMonth } }, _sum: { amountInPaise: true } }),

      prisma.tutorCourse.count({ where: { tutorId: tutor.id } }),

      prisma.review.aggregate({ where: { tutorId: tutor.id }, _avg: { rating: true } }),

      prisma.enrollmentSession.findMany({
        where: { enrollment: { tutorId: tutor.id }, status: { in: ['CONFIRMED', 'SCHEDULED'] }, scheduledDate: { gte: now } },
        orderBy: { scheduledDate: 'asc' },
        take: 5,
        include: {
          enrollment: {
            select: {
              student: { select: { firstName: true, lastName: true } },
              subject: { select: { name: true } },
              zoomLink: true,
              classType: true,
            },
          },
        },
      }),

      prisma.enrollment.findMany({
        where: { tutorId: tutor.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          createdAt: true,
          student: { select: { firstName: true, lastName: true } },
          subject: { select: { name: true } },
        },
      }),

      prisma.review.findMany({
        where: { tutorId: tutor.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { rating: true, comment: true, createdAt: true, parent: { select: { firstName: true } } },
      }),

      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    // Recent activity: merge enrollments + reviews
    const activity: { type: string; message: string; time: Date }[] = [];
    for (const e of recentEnrollments) {
      activity.push({ type: 'enrollment', message: `${e.student.firstName} ${e.student.lastName} enrolled in ${e.subject.name}`, time: e.createdAt });
    }
    for (const r of recentReviews) {
      activity.push({ type: 'review', message: `${r.parent.firstName} rated you ${r.rating} stars`, time: r.createdAt });
    }
    activity.sort((a, b) => b.time.getTime() - a.time.getTime());

    return {
      stats: {
        totalStudents,
        upcomingSessions: upcomingSessionCount,
        completedSessions,
        totalEarnings: totalEarnings._sum.amountInPaise || 0,
        coursesCount,
        averageRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : 0,
      },
      earningsSummary: {
        unpaidInPaise: unpaidEarnings._sum.amountInPaise || 0,
        thisMonthInPaise: thisMonthEarnings._sum.amountInPaise || 0,
      },
      upcomingSessions: upcomingSessions.map((s) => ({
        subject: s.enrollment.subject.name,
        student: `${s.enrollment.student.firstName} ${s.enrollment.student.lastName}`,
        date: s.scheduledDate,
        time: s.scheduledStart,
        type: s.enrollment.classType === 'ONE_TO_ONE' ? '1:1' : 'Group',
        zoomLink: s.enrollment.zoomLink,
      })),
      recentActivity: activity.slice(0, 8).map((a) => ({ type: a.type, message: a.message, time: a.time.toISOString() })),
      notifications: { unreadCount: unreadNotifications },
    };
  }

  // ==========================================
  // CONSULTANT DASHBOARD
  // ==========================================

  async getConsultantDashboard(userId: string) {
    const consultant = await prisma.consultantProfile.findUnique({ where: { userId } });
    if (!consultant) throw ApiError.notFound('Consultant profile not found');

    const now = new Date();

    const [
      pendingRequests,
      totalRequests,
      confirmedBookings,
      completedBookings,
      recentRequests,
      upcomingDemos,
      unreadNotifications,
    ] = await Promise.all([
      prisma.demoRequest.count({ where: { consultantId: consultant.id, status: 'PENDING' } }),

      prisma.demoRequest.count({ where: { consultantId: consultant.id } }),

      prisma.demoBooking.count({ where: { consultantId: consultant.id, status: 'CONFIRMED' } }),

      prisma.demoBooking.count({ where: { consultantId: consultant.id, status: 'COMPLETED' } }),

      prisma.demoRequest.findMany({
        where: { consultantId: consultant.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          parentName: true,
          childFirstName: true,
          status: true,
          preferredDate: true,
          createdAt: true,
          subjects: { include: { subject: { select: { name: true } } } },
        },
      }),

      prisma.demoBooking.findMany({
        where: { consultantId: consultant.id, status: 'CONFIRMED', scheduledDate: { gte: now } },
        orderBy: { scheduledDate: 'asc' },
        take: 5,
        select: {
          id: true,
          scheduledDate: true,
          scheduledStart: true,
          meetingLink: true,
          subject: { select: { name: true } },
          tutor: { select: { firstName: true, lastName: true } },
          student: { select: { firstName: true, lastName: true } },
        },
      }),

      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      pendingDemoRequests: pendingRequests,
      totalDemoRequests: totalRequests,
      activeDemoBookings: confirmedBookings,
      completedDemos: completedBookings,
      recentDemoRequests: recentRequests.map((r) => ({
        id: r.id,
        parentName: r.parentName,
        childName: r.childFirstName,
        subjects: r.subjects.map((s) => s.subject.name).join(', '),
        status: r.status,
        date: r.preferredDate,
        createdAt: r.createdAt,
      })),
      upcomingDemos: upcomingDemos.map((d) => ({
        id: d.id,
        subject: d.subject.name,
        tutor: `${d.tutor.firstName} ${d.tutor.lastName}`,
        student: d.student ? `${d.student.firstName} ${d.student.lastName}` : 'TBD',
        date: d.scheduledDate,
        time: d.scheduledStart,
        meetingLink: d.meetingLink,
      })),
      notifications: { unreadCount: unreadNotifications },
    };
  }
}
