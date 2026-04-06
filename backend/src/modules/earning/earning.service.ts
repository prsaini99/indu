import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { EarningQueryDTO, CreatePayoutDTO, PayoutQueryDTO } from './earning.types';

export class EarningService {
  // ==========================================
  // AUTO-CREATE EARNING ON SESSION COMPLETION
  // ==========================================

  async createEarningForSession(sessionId: string): Promise<void> {
    // Idempotency: skip if earning already exists
    const existing = await prisma.tutorEarning.findUnique({
      where: { bookingId: sessionId },
    });
    if (existing) return;

    // Look up session → enrollment → tutor + subject + student → course → tutorCourse rate
    const session = await prisma.enrollmentSession.findUnique({
      where: { id: sessionId },
      include: {
        enrollment: {
          include: {
            student: { select: { gradeId: true } },
          },
        },
      },
    });

    if (!session || session.status !== 'COMPLETED') return;

    const { tutorId, subjectId } = session.enrollment;
    const gradeId = session.enrollment.student.gradeId;

    // Find the course for this subject + grade combination
    const course = await prisma.course.findFirst({
      where: { subjectId, gradeId },
    });

    let amountInPaise = 0;

    if (course) {
      // Find the tutor's rate for this course
      const tutorCourse = await prisma.tutorCourse.findFirst({
        where: { tutorId, courseId: course.id },
      });
      amountInPaise = tutorCourse?.tutorRate ?? 0;
    }

    if (amountInPaise === 0) {
      console.warn(`[EARNING] No tutor rate found for session ${sessionId}, tutor ${tutorId}. Skipping earning creation.`);
      return; // Don't create phantom ₹0 earnings
    }

    await prisma.tutorEarning.create({
      data: {
        tutorId,
        bookingId: sessionId,
        amountInPaise,
        status: 'UNPAID',
      },
    });
  }

  // ==========================================
  // TUTOR: LIST OWN EARNINGS
  // ==========================================

  async listForTutor(userId: string, query: EarningQueryDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { tutorId: tutor.id };
    if (query.status) where.status = query.status;

    const [earnings, total] = await Promise.all([
      prisma.tutorEarning.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              enrollment: {
                include: {
                  subject: { select: { id: true, name: true } },
                  student: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
      prisma.tutorEarning.count({ where }),
    ]);

    const data = earnings.map((e) => ({
      id: e.id,
      bookingId: e.bookingId,
      subject: e.booking.enrollment.subject.name,
      studentName: `${e.booking.enrollment.student.firstName} ${e.booking.enrollment.student.lastName}`,
      classDate: e.booking.scheduledDate,
      amountInPaise: e.amountInPaise,
      status: e.status,
      paidAt: e.paidAt,
      createdAt: e.createdAt,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // TUTOR: EARNINGS SUMMARY
  // ==========================================

  async getSummaryForTutor(userId: string) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const allEarnings = await prisma.tutorEarning.findMany({
      where: { tutorId: tutor.id },
      select: { amountInPaise: true, status: true, createdAt: true },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalEarned = 0;
    let totalUnpaid = 0;
    let totalPaid = 0;
    let thisMonthEarned = 0;
    let thisMonthClasses = 0;

    for (const e of allEarnings) {
      totalEarned += e.amountInPaise;
      if (e.status === 'UNPAID') totalUnpaid += e.amountInPaise;
      else totalPaid += e.amountInPaise;

      if (e.createdAt >= startOfMonth) {
        thisMonthEarned += e.amountInPaise;
        thisMonthClasses++;
      }
    }

    return {
      totalEarnedInPaise: totalEarned,
      unpaidInPaise: totalUnpaid,
      paidInPaise: totalPaid,
      totalClasses: allEarnings.length,
      thisMonth: {
        earnedInPaise: thisMonthEarned,
        classes: thisMonthClasses,
      },
    };
  }

  // ==========================================
  // ADMIN: LIST ALL EARNINGS
  // ==========================================

  async listAll(query: EarningQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.tutorId) where.tutorId = query.tutorId;

    const [earnings, total] = await Promise.all([
      prisma.tutorEarning.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tutor: { select: { id: true, firstName: true, lastName: true } },
          booking: {
            include: {
              enrollment: {
                include: {
                  subject: { select: { id: true, name: true } },
                  student: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
      prisma.tutorEarning.count({ where }),
    ]);

    const data = earnings.map((e) => ({
      id: e.id,
      bookingId: e.bookingId,
      tutorName: `${e.tutor.firstName} ${e.tutor.lastName}`,
      tutorId: e.tutorId,
      subject: e.booking.enrollment.subject.name,
      studentName: `${e.booking.enrollment.student.firstName} ${e.booking.enrollment.student.lastName}`,
      classDate: e.booking.scheduledDate,
      amountInPaise: e.amountInPaise,
      status: e.status,
      paidAt: e.paidAt,
      createdAt: e.createdAt,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // ADMIN: AGGREGATE SUMMARY
  // ==========================================

  async getAdminSummary() {
    const allEarnings = await prisma.tutorEarning.findMany({
      select: { amountInPaise: true, status: true, createdAt: true },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalEarned = 0;
    let totalUnpaid = 0;
    let totalPaid = 0;
    let thisMonthEarned = 0;

    for (const e of allEarnings) {
      totalEarned += e.amountInPaise;
      if (e.status === 'UNPAID') totalUnpaid += e.amountInPaise;
      else totalPaid += e.amountInPaise;

      if (e.createdAt >= startOfMonth) {
        thisMonthEarned += e.amountInPaise;
      }
    }

    return {
      totalEarnedInPaise: totalEarned,
      unpaidInPaise: totalUnpaid,
      paidInPaise: totalPaid,
      totalRecords: allEarnings.length,
      thisMonthEarnedInPaise: thisMonthEarned,
    };
  }

  // ==========================================
  // ADMIN: CSV EXPORT
  // ==========================================

  async exportCsv(query: EarningQueryDTO): Promise<string> {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.tutorId) where.tutorId = query.tutorId;

    const earnings = await prisma.tutorEarning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tutor: { select: { firstName: true, lastName: true } },
        booking: {
          include: {
            enrollment: {
              include: {
                subject: { select: { name: true } },
                student: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    const header = 'Tutor Name,Earning ID,Subject,Student Name,Class Date,Amount (INR),Status,Paid At';
    const rows = earnings.map((e) => {
      const amountInr = (e.amountInPaise / 100).toFixed(2);
      return [
        `${e.tutor.firstName} ${e.tutor.lastName}`,
        e.id,
        e.booking.enrollment.subject.name,
        `${e.booking.enrollment.student.firstName} ${e.booking.enrollment.student.lastName}`,
        e.booking.scheduledDate.toISOString().split('T')[0],
        amountInr,
        e.status,
        e.paidAt ? e.paidAt.toISOString() : '',
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  // ==========================================
  // ADMIN: RECORD PAYOUT
  // ==========================================

  async createPayout(data: CreatePayoutDTO) {
    // Validate all earnings exist, belong to the tutor, and are UNPAID
    const earnings = await prisma.tutorEarning.findMany({
      where: {
        id: { in: data.earningIds },
        tutorId: data.tutorId,
      },
    });

    if (earnings.length !== data.earningIds.length) {
      throw ApiError.badRequest('INVALID_EARNINGS', 'One or more earning IDs are invalid or do not belong to this tutor');
    }

    const nonUnpaid = earnings.filter((e) => e.status !== 'UNPAID');
    if (nonUnpaid.length > 0) {
      throw ApiError.badRequest('ALREADY_PAID', `${nonUnpaid.length} earning(s) are already marked as paid`);
    }

    const totalAmountInPaise = earnings.reduce((sum, e) => sum + e.amountInPaise, 0);

    // Transaction: mark all as PAID + create PayoutRecord
    const result = await prisma.$transaction(async (tx) => {
      await tx.tutorEarning.updateMany({
        where: { id: { in: data.earningIds } },
        data: { status: 'PAID', paidAt: new Date() },
      });

      const payout = await tx.payoutRecord.create({
        data: {
          tutorId: data.tutorId,
          totalAmountInPaise,
          earningIds: data.earningIds,
          paidVia: data.paidVia,
          referenceNo: data.referenceNo,
          notes: data.notes,
        },
      });

      return payout;
    });

    // Notify tutor (non-blocking)
    try {
      const { NotificationService } = await import('../notification/notification.service');
      const { payoutRecordedTutor } = await import('../notification/templates/event-templates');
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { id: data.tutorId },
        include: { user: { select: { id: true, email: true } } },
      });
      if (tutorProfile) {
        const ns = new NotificationService();
        const template = payoutRecordedTutor(
          (result.totalAmountInPaise / 100).toFixed(2),
          result.referenceNo || undefined
        );
        await ns.send({
          userId: tutorProfile.user.id,
          userEmail: tutorProfile.user.email,
          type: 'PAYOUT_RECORDED',
          ...template,
          emailHtml: template.html,
        });
      }
    } catch (err) {
      console.error('Payout notification failed (non-blocking):', err);
    }

    return {
      id: result.id,
      tutorId: result.tutorId,
      totalAmountInPaise: result.totalAmountInPaise,
      earningsMarkedPaid: data.earningIds.length,
      paidVia: result.paidVia,
      referenceNo: result.referenceNo,
    };
  }

  // ==========================================
  // ADMIN: LIST PAYOUTS
  // ==========================================

  async listPayouts(query: PayoutQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.tutorId) where.tutorId = query.tutorId;

    const [payouts, total] = await Promise.all([
      prisma.payoutRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tutor: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.payoutRecord.count({ where }),
    ]);

    const data = payouts.map((p) => ({
      id: p.id,
      tutorId: p.tutorId,
      tutorName: `${p.tutor.firstName} ${p.tutor.lastName}`,
      totalAmountInPaise: p.totalAmountInPaise,
      earningsCount: p.earningIds.length,
      paidVia: p.paidVia,
      referenceNo: p.referenceNo,
      notes: p.notes,
      createdAt: p.createdAt,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }
}
