import prisma from '../../config/database';

export class AnalyticsService {
  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      usersByRole,
      enrollmentsByStatus,
      batchesByStatus,
      sessionsCompleted,
      sessionsThisMonth,
      sessionsNoShow,
      batchSessionsCompleted,
      revenueTotal,
      revenueThisMonth,
      earningsTotal,
      earningsUnpaid,
      earningsPaid,
      reviewStats,
      creditsPurchased,
      creditsUsed,
      recentPayments,
      topTutorEarnings,
      topSubjectEnrollments,
      recentEnrollments,
      recentReviews,
    ] = await Promise.all([
      // 1. Users by role
      prisma.user.groupBy({ by: ['role'], _count: true, where: { deletedAt: null } }),

      // 2. Enrollments by status
      prisma.enrollment.groupBy({ by: ['status'], _count: true }),

      // 3. Batches by status
      prisma.batch.groupBy({ by: ['status'], _count: true }),

      // 4. Sessions completed (enrollment)
      prisma.enrollmentSession.count({ where: { status: 'COMPLETED' } }),

      // 5. Sessions this month
      prisma.enrollmentSession.count({ where: { status: 'COMPLETED', scheduledDate: { gte: startOfMonth } } }),

      // 6. No-shows
      prisma.enrollmentSession.count({ where: { status: { in: ['NO_SHOW_REPORTED', 'MISSED_TUTOR'] } } }),

      // 7. Batch sessions completed
      prisma.batchSession.count({ where: { status: 'COMPLETED' } }),

      // 8. Revenue total
      prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amountInFils: true }, _count: true }),

      // 9. Revenue this month
      prisma.payment.aggregate({ where: { status: 'COMPLETED', completedAt: { gte: startOfMonth } }, _sum: { amountInFils: true } }),

      // 10. Earnings total
      prisma.tutorEarning.aggregate({ _sum: { amountInPaise: true }, _count: true }),

      // 11. Earnings unpaid
      prisma.tutorEarning.aggregate({ where: { status: 'UNPAID' }, _sum: { amountInPaise: true } }),

      // 12. Earnings paid
      prisma.tutorEarning.aggregate({ where: { status: 'PAID' }, _sum: { amountInPaise: true } }),

      // 13. Reviews
      prisma.review.aggregate({ _avg: { rating: true }, _count: true }),

      // 14. Credits purchased
      prisma.creditTransaction.aggregate({ where: { type: 'PURCHASE' }, _sum: { amount: true } }),

      // 15. Credits used
      prisma.creditTransaction.aggregate({ where: { type: 'DEDUCTION' }, _sum: { amount: true } }),

      // 16. Recent payments (for monthly revenue)
      prisma.payment.findMany({
        where: { status: 'COMPLETED', completedAt: { gte: sixMonthsAgo } },
        select: { amountInFils: true, completedAt: true },
      }),

      // 17. Top tutors by earnings
      prisma.tutorEarning.groupBy({
        by: ['tutorId'],
        _sum: { amountInPaise: true },
        _count: true,
        orderBy: { _sum: { amountInPaise: 'desc' } },
        take: 5,
      }),

      // 18. Top subjects by enrollment count
      prisma.enrollment.groupBy({
        by: ['subjectId'],
        _count: true,
        orderBy: { _count: { subjectId: 'desc' } },
        take: 5,
      }),

      // 19. Recent enrollments (for activity feed)
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          student: { select: { firstName: true, lastName: true } },
          subject: { select: { name: true } },
        },
      }),

      // 20. Recent reviews
      prisma.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          rating: true,
          tutor: { select: { firstName: true, lastName: true } },
          parent: { select: { firstName: true } },
        },
      }),
    ]);

    // --- Build response ---

    // Users
    const userRoleMap: Record<string, number> = {};
    for (const r of usersByRole) userRoleMap[r.role] = r._count;
    const users = {
      total: Object.values(userRoleMap).reduce((a, b) => a + b, 0),
      parents: userRoleMap['PARENT'] || 0,
      tutors: userRoleMap['TUTOR'] || 0,
      consultants: userRoleMap['CONSULTANT'] || 0,
      admins: (userRoleMap['ADMIN'] || 0) + (userRoleMap['SUPER_ADMIN'] || 0),
    };

    // Enrollments
    const enrollMap: Record<string, number> = {};
    for (const e of enrollmentsByStatus) enrollMap[e.status] = e._count;
    const enrollments = {
      total: Object.values(enrollMap).reduce((a, b) => a + b, 0),
      active: enrollMap['ACTIVE'] || 0,
      paused: enrollMap['PAUSED'] || 0,
      cancelled: enrollMap['CANCELLED'] || 0,
    };

    // Batches
    const batchMap: Record<string, number> = {};
    for (const b of batchesByStatus) batchMap[b.status] = b._count;
    const batches = {
      total: Object.values(batchMap).reduce((a, b) => a + b, 0),
      open: batchMap['OPEN'] || 0,
      active: batchMap['ACTIVE'] || 0,
      full: batchMap['FULL'] || 0,
      completed: batchMap['COMPLETED'] || 0,
      cancelled: batchMap['CANCELLED'] || 0,
    };

    // Sessions
    const sessions = {
      totalCompleted: sessionsCompleted + batchSessionsCompleted,
      thisMonth: sessionsThisMonth,
      noShows: sessionsNoShow,
    };

    // Revenue
    const revenue = {
      totalInFils: revenueTotal._sum.amountInFils || 0,
      thisMonthInFils: revenueThisMonth._sum.amountInFils || 0,
      totalPayments: revenueTotal._count || 0,
    };

    // Earnings
    const earnings = {
      totalInPaise: earningsTotal._sum.amountInPaise || 0,
      unpaidInPaise: earningsUnpaid._sum.amountInPaise || 0,
      paidInPaise: earningsPaid._sum.amountInPaise || 0,
    };

    // Reviews
    const reviews = {
      total: reviewStats._count || 0,
      averageRating: reviewStats._avg.rating ? Math.round(reviewStats._avg.rating * 10) / 10 : 0,
    };

    // Credits
    const credits = {
      totalPurchased: creditsPurchased._sum.amount || 0,
      totalUsed: creditsUsed._sum.amount || 0,
    };

    // Monthly revenue (group by month)
    const monthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, 0);
    }
    for (const p of recentPayments) {
      if (p.completedAt) {
        const key = `${p.completedAt.getFullYear()}-${String(p.completedAt.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, (monthMap.get(key) || 0) + p.amountInFils);
      }
    }
    const monthlyRevenue = [...monthMap.entries()].map(([month, amount]) => ({ month, amount }));

    // Top tutors
    const tutorIds = topTutorEarnings.map((t) => t.tutorId);
    const tutorProfiles = await prisma.tutorProfile.findMany({
      where: { id: { in: tutorIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const tutorRatings = await prisma.review.groupBy({
      by: ['tutorId'],
      where: { tutorId: { in: tutorIds } },
      _avg: { rating: true },
    });
    const tutorNameMap = new Map(tutorProfiles.map((t) => [t.id, `${t.firstName} ${t.lastName}`]));
    const tutorRatingMap = new Map(tutorRatings.map((r) => [r.tutorId, Math.round((r._avg.rating || 0) * 10) / 10]));
    const topTutors = topTutorEarnings.map((t) => ({
      name: tutorNameMap.get(t.tutorId) || 'Unknown',
      sessions: t._count,
      earned: t._sum.amountInPaise || 0,
      rating: tutorRatingMap.get(t.tutorId) || 0,
    }));

    // Top subjects
    const subjectIds = topSubjectEnrollments.map((s) => s.subjectId);
    const subjectNames = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });
    const subjectNameMap = new Map(subjectNames.map((s) => [s.id, s.name]));
    const topSubjects = topSubjectEnrollments.map((s) => ({
      name: subjectNameMap.get(s.subjectId) || 'Unknown',
      enrollments: s._count,
    }));

    // Recent activity
    const activity: { type: string; message: string; time: Date }[] = [];
    for (const e of recentEnrollments) {
      activity.push({
        type: 'enrollment',
        message: `${e.student.firstName} ${e.student.lastName} enrolled in ${e.subject.name}`,
        time: e.createdAt,
      });
    }
    for (const r of recentReviews) {
      activity.push({
        type: 'review',
        message: `${r.parent.firstName} rated ${r.tutor.firstName} ${r.tutor.lastName} ${r.rating} stars`,
        time: r.createdAt,
      });
    }
    activity.sort((a, b) => b.time.getTime() - a.time.getTime());
    const recentActivity = activity.slice(0, 10).map((a) => ({
      type: a.type,
      message: a.message,
      time: a.time.toISOString(),
    }));

    return {
      users,
      enrollments,
      batches,
      sessions,
      revenue,
      earnings,
      reviews,
      credits,
      monthlyRevenue,
      topTutors,
      topSubjects,
      recentActivity,
    };
  }
}
