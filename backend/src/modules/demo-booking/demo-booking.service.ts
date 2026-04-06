import { DemoBookingStatus, DemoRequestStatus, Role } from '@prisma/client';
import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { CreateDemoBookingDTO, UpdateDemoBookingDTO, DemoBookingQueryDTO } from './demo-booking.types';

// Valid state transitions
const VALID_TRANSITIONS: Record<DemoBookingStatus, DemoBookingStatus[]> = {
  PENDING: [DemoBookingStatus.CONFIRMED, DemoBookingStatus.CANCELLED],
  CONFIRMED: [DemoBookingStatus.COMPLETED, DemoBookingStatus.CANCELLED, DemoBookingStatus.NO_SHOW],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const demoBookingInclude = {
  demoRequest: { select: { id: true, parentName: true, contactEmail: true, contactPhone: true, childFirstName: true, childLastName: true } },
  student: { select: { id: true, firstName: true, lastName: true } },
  tutor: { select: { id: true, firstName: true, lastName: true, user: { select: { timezone: true } } } },
  consultant: { select: { id: true, firstName: true, lastName: true } },
  subject: { select: { id: true, name: true } },
};

function formatDemoBooking(db: Record<string, unknown>) {
  const raw = db as {
    id: string;
    status: DemoBookingStatus;
    scheduledDate: Date;
    scheduledStart: string;
    scheduledEnd: string;
    meetingLink: string | null;
    meetingPassword: string | null;
    parentNotes: string | null;
    consultantNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
    demoRequest: { id: string; parentName: string; contactEmail: string; contactPhone: string; childFirstName: string; childLastName: string } | null;
    student: { id: string; firstName: string; lastName: string } | null;
    tutor: { id: string; firstName: string; lastName: string; user: { timezone: string } };
    consultant: { id: string; firstName: string; lastName: string };
    subject: { id: string; name: string };
  };

  return {
    id: raw.id,
    status: raw.status,
    scheduledDate: raw.scheduledDate,
    scheduledStart: raw.scheduledStart,
    scheduledEnd: raw.scheduledEnd,
    meetingLink: raw.meetingLink,
    meetingPassword: raw.meetingPassword,
    parentNotes: raw.parentNotes,
    consultantNotes: raw.consultantNotes,
    demoRequest: raw.demoRequest,
    student: raw.student,
    tutor: raw.tutor,
    consultant: raw.consultant,
    subject: raw.subject,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class DemoBookingService {
  // ==========================================
  // CONSULTANT: Create demo booking
  // ==========================================
  async create(userId: string, data: CreateDemoBookingDTO) {
    const consultantProfile = await prisma.consultantProfile.findUnique({ where: { userId } });
    if (!consultantProfile) throw ApiError.notFound('Consultant profile not found');

    // Validate tutor exists and is active
    const tutor = await prisma.tutorProfile.findUnique({ where: { id: data.tutorId } });
    if (!tutor || !tutor.isActive) throw ApiError.badRequest('INVALID_TUTOR', 'Tutor not found or inactive');

    // Validate subject exists
    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject || !subject.isActive) throw ApiError.badRequest('INVALID_SUBJECT', 'Subject not found or inactive');

    // Validate student if provided
    if (data.studentId) {
      const student = await prisma.student.findUnique({ where: { id: data.studentId } });
      if (!student) throw ApiError.badRequest('INVALID_STUDENT', 'Student not found');
    }

    // Validate demo request if provided
    if (data.demoRequestId) {
      const dr = await prisma.demoRequest.findUnique({ where: { id: data.demoRequestId } });
      if (!dr) throw ApiError.badRequest('INVALID_DEMO_REQUEST', 'Demo request not found');
      // Check it's assigned to this consultant
      if (dr.consultantId !== consultantProfile.id) {
        throw ApiError.forbidden('Demo request is not assigned to you');
      }
    }

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.demoBooking.create({
        data: {
          demoRequestId: data.demoRequestId,
          studentId: data.studentId,
          tutorId: data.tutorId,
          consultantId: consultantProfile.id,
          subjectId: data.subjectId,
          status: DemoBookingStatus.CONFIRMED,
          scheduledDate: new Date(data.scheduledDate),
          scheduledStart: data.scheduledStart,
          scheduledEnd: data.scheduledEnd,
          meetingLink: data.meetingLink,
          meetingPassword: data.meetingPassword,
          parentNotes: data.parentNotes,
          consultantNotes: data.consultantNotes,
        },
        include: demoBookingInclude,
      });

      // If linked to a demo request, auto-transition it to CONFIRMED
      if (data.demoRequestId) {
        await tx.demoRequest.update({
          where: { id: data.demoRequestId },
          data: { status: DemoRequestStatus.CONFIRMED },
        });
      }

      return newBooking;
    });

    // Auto-generate Zoom meeting link if none provided (non-blocking)
    if (!data.meetingLink) {
      try {
        const { ZoomService } = await import('../zoom/zoom.service');
        const zoom = new ZoomService();
        // Compute duration in minutes from start/end time
        const [sh, sm] = data.scheduledStart.split(':').map(Number);
        const [eh, em] = data.scheduledEnd.split(':').map(Number);
        const durationMin = (eh * 60 + em) - (sh * 60 + sm);
        const startISO = `${data.scheduledDate}T${data.scheduledStart}:00`;

        const meeting = await zoom.createSingleMeeting(
          `Demo: ${subject!.name}`,
          startISO,
          durationMin > 0 ? durationMin : 60,
          'Asia/Dubai'
        );
        await prisma.demoBooking.update({
          where: { id: booking.id },
          data: {
            meetingLink: meeting.joinUrl,
            meetingPassword: meeting.password,
            zoomMeetingId: meeting.meetingId,
          },
        });
        (booking as any).meetingLink = meeting.joinUrl;
        (booking as any).meetingPassword = meeting.password;
      } catch (err) {
        console.error('Zoom meeting creation failed for demo (non-blocking):', err);
      }
    }

    return formatDemoBooking(booking as unknown as Record<string, unknown>);
  }

  // ==========================================
  // CONSULTANT: List own demo bookings
  // ==========================================
  async listForConsultant(userId: string, query: DemoBookingQueryDTO) {
    const consultantProfile = await prisma.consultantProfile.findUnique({ where: { userId } });
    if (!consultantProfile) throw ApiError.notFound('Consultant profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { consultantId: consultantProfile.id };
    if (query.status) where.status = query.status;

    const [bookings, total] = await Promise.all([
      prisma.demoBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: demoBookingInclude,
      }),
      prisma.demoBooking.count({ where }),
    ]);

    return {
      data: bookings.map((b) => formatDemoBooking(b as unknown as Record<string, unknown>)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ==========================================
  // TUTOR: List assigned demo bookings
  // ==========================================
  async listForTutor(userId: string, query: DemoBookingQueryDTO) {
    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutorProfile) throw ApiError.notFound('Tutor profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { tutorId: tutorProfile.id };
    if (query.status) where.status = query.status;

    const [bookings, total] = await Promise.all([
      prisma.demoBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: demoBookingInclude,
      }),
      prisma.demoBooking.count({ where }),
    ]);

    return {
      data: bookings.map((b) => formatDemoBooking(b as unknown as Record<string, unknown>)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ==========================================
  // PARENT: List demo bookings for own children
  // ==========================================
  async listForParent(userId: string, query: DemoBookingQueryDTO) {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: { children: { select: { id: true } } },
    });
    if (!parentProfile) throw ApiError.notFound('Parent profile not found');

    const childIds = parentProfile.children.map((c) => c.id);
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    // Also include bookings linked via demoRequest (public flow — no studentId)
    const where: Record<string, unknown> = {
      OR: [
        { studentId: { in: childIds } },
        { demoRequest: { parentId: parentProfile.id } },
      ],
    };
    if (query.status) where.status = query.status;

    const [bookings, total] = await Promise.all([
      prisma.demoBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: demoBookingInclude,
      }),
      prisma.demoBooking.count({ where }),
    ]);

    return {
      data: bookings.map((b) => formatDemoBooking(b as unknown as Record<string, unknown>)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ==========================================
  // Get single demo booking (access-controlled)
  // ==========================================
  async getById(userId: string, userRole: Role, bookingId: string) {
    const booking = await prisma.demoBooking.findUnique({
      where: { id: bookingId },
      include: demoBookingInclude,
    });

    if (!booking) throw ApiError.notFound('Demo booking not found');

    if (userRole === Role.CONSULTANT) {
      const cp = await prisma.consultantProfile.findUnique({ where: { userId } });
      if (!cp || booking.consultantId !== cp.id) throw ApiError.forbidden('Not your booking');
    } else if (userRole === Role.TUTOR) {
      const tp = await prisma.tutorProfile.findUnique({ where: { userId } });
      if (!tp || booking.tutorId !== tp.id) throw ApiError.forbidden('Not your booking');
    } else if (userRole === Role.PARENT) {
      const pp = await prisma.parentProfile.findUnique({
        where: { userId },
        include: { children: { select: { id: true } } },
      });
      if (!pp) throw ApiError.forbidden('Not authorized');
      const childIds = pp.children.map((c) => c.id);
      const isOwnChild = booking.studentId && childIds.includes(booking.studentId);
      const isOwnRequest = booking.demoRequestId
        ? (await prisma.demoRequest.findUnique({ where: { id: booking.demoRequestId } }))?.parentId === pp.id
        : false;
      if (!isOwnChild && !isOwnRequest) throw ApiError.forbidden('Not your booking');
    }

    return formatDemoBooking(booking as unknown as Record<string, unknown>);
  }

  // ==========================================
  // CONSULTANT: Update booking details
  // ==========================================
  async update(userId: string, bookingId: string, data: Record<string, unknown>) {
    const cp = await prisma.consultantProfile.findUnique({ where: { userId } });
    if (!cp) throw ApiError.notFound('Consultant profile not found');

    const booking = await prisma.demoBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Demo booking not found');
    if (booking.consultantId !== cp.id) throw ApiError.forbidden('Not your booking');

    const updateData: Record<string, unknown> = {};
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate as string);
    if (data.scheduledStart) updateData.scheduledStart = data.scheduledStart;
    if (data.scheduledEnd) updateData.scheduledEnd = data.scheduledEnd;
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink;
    if (data.meetingPassword !== undefined) updateData.meetingPassword = data.meetingPassword;
    if (data.consultantNotes !== undefined) updateData.consultantNotes = data.consultantNotes;

    const updated = await prisma.demoBooking.update({
      where: { id: bookingId },
      data: updateData,
      include: demoBookingInclude,
    });

    return formatDemoBooking(updated as unknown as Record<string, unknown>);
  }

  // ==========================================
  // CONSULTANT/ADMIN: Update status
  // ==========================================
  async updateStatus(userId: string, userRole: Role, bookingId: string, newStatus: DemoBookingStatus) {
    const booking = await prisma.demoBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Demo booking not found');

    const allowed = VALID_TRANSITIONS[booking.status];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest('INVALID_TRANSITION', `Cannot transition from ${booking.status} to ${newStatus}`);
    }

    if (userRole === Role.CONSULTANT) {
      const cp = await prisma.consultantProfile.findUnique({ where: { userId } });
      if (!cp || booking.consultantId !== cp.id) throw ApiError.forbidden('Not your booking');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.demoBooking.update({
        where: { id: bookingId },
        data: { status: newStatus },
        include: demoBookingInclude,
      });

      // If demo completed, also update linked demo request
      if (newStatus === DemoBookingStatus.COMPLETED && booking.demoRequestId) {
        await tx.demoRequest.update({
          where: { id: booking.demoRequestId },
          data: { status: DemoRequestStatus.COMPLETED },
        });
      }

      return result;
    });

    return formatDemoBooking(updated as unknown as Record<string, unknown>);
  }

  // ==========================================
  // ADMIN: List all demo bookings
  // ==========================================
  async listAll(query: DemoBookingQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [bookings, total] = await Promise.all([
      prisma.demoBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: demoBookingInclude,
      }),
      prisma.demoBooking.count({ where }),
    ]);

    return {
      data: bookings.map((b) => formatDemoBooking(b as unknown as Record<string, unknown>)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
