import { DemoRequestStatus, Role } from '@prisma/client';
import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { CreateDemoRequestDTO, PublicCreateDemoRequestDTO, DemoRequestQueryDTO } from './demo-request.types';

// Valid state transitions
const VALID_TRANSITIONS: Record<DemoRequestStatus, DemoRequestStatus[]> = {
  PENDING: [DemoRequestStatus.ASSIGNED, DemoRequestStatus.CANCELLED],
  ASSIGNED: [DemoRequestStatus.CONFIRMED, DemoRequestStatus.CANCELLED],
  CONFIRMED: [DemoRequestStatus.COMPLETED, DemoRequestStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

// Common select/include for formatted responses
const demoRequestInclude = {
  board: { select: { id: true, name: true } },
  grade: { select: { id: true, name: true } },
  subjects: { include: { subject: { select: { id: true, name: true } } } },
  parent: { select: { id: true, firstName: true, lastName: true } },
  consultant: { select: { id: true, firstName: true, lastName: true } },
};

function formatDemoRequest(dr: Record<string, unknown>) {
  const raw = dr as {
    id: string;
    parentName: string;
    contactEmail: string;
    contactPhone: string;
    childFirstName: string;
    childLastName: string;
    childDateOfBirth: Date | null;
    status: DemoRequestStatus;
    preferredTimeSlot: string;
    preferredDate: Date;
    alternativeDate: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    board: { id: string; name: string };
    grade: { id: string; name: string };
    subjects: { subject: { id: string; name: string } }[];
    parent: { id: string; firstName: string; lastName: string } | null;
    consultant: { id: string; firstName: string; lastName: string } | null;
  };

  return {
    id: raw.id,
    parentName: raw.parentName,
    contactEmail: raw.contactEmail,
    contactPhone: raw.contactPhone,
    childFirstName: raw.childFirstName,
    childLastName: raw.childLastName,
    childDateOfBirth: raw.childDateOfBirth,
    board: raw.board,
    grade: raw.grade,
    subjects: raw.subjects.map((s) => s.subject),
    preferredTimeSlot: raw.preferredTimeSlot,
    preferredDate: raw.preferredDate,
    alternativeDate: raw.alternativeDate,
    notes: raw.notes,
    status: raw.status,
    parent: raw.parent,
    consultant: raw.consultant,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// Shared validation for board, grade, subjects
async function validateReferences(data: { boardId: string; gradeId: string; subjectIds: string[] }) {
  const board = await prisma.board.findUnique({ where: { id: data.boardId } });
  if (!board || !board.isActive) throw ApiError.badRequest('INVALID_BOARD', 'Board not found or inactive');

  const grade = await prisma.gradeLevel.findUnique({ where: { id: data.gradeId } });
  if (!grade) throw ApiError.badRequest('INVALID_GRADE', 'Grade level not found');

  const subjects = await prisma.subject.findMany({
    where: { id: { in: data.subjectIds }, isActive: true },
  });
  if (subjects.length !== data.subjectIds.length) {
    throw ApiError.badRequest('INVALID_SUBJECT', 'One or more subjects not found or inactive');
  }
}

export class DemoRequestService {
  // ==========================================
  // PUBLIC: Create demo request (no auth)
  // ==========================================
  async createPublic(data: PublicCreateDemoRequestDTO) {
    await validateReferences(data);

    const demoRequest = await prisma.demoRequest.create({
      data: {
        parentName: data.parentName,
        contactEmail: data.contactEmail.toLowerCase(),
        contactPhone: data.contactPhone,
        childFirstName: data.childFirstName,
        childLastName: data.childLastName,
        childDateOfBirth: data.childDateOfBirth ? new Date(data.childDateOfBirth) : undefined,
        boardId: data.boardId,
        gradeId: data.gradeId,
        preferredTimeSlot: data.preferredTimeSlot,
        preferredDate: new Date(data.preferredDate),
        alternativeDate: data.alternativeDate ? new Date(data.alternativeDate) : undefined,
        notes: data.notes,
        subjects: {
          create: data.subjectIds.map((subjectId) => ({ subjectId })),
        },
      },
      include: demoRequestInclude,
    });

    return formatDemoRequest(demoRequest as unknown as Record<string, unknown>);
  }

  // ==========================================
  // PARENT: Create demo request (authenticated)
  // ==========================================
  async create(userId: string, data: CreateDemoRequestDTO) {
    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parentProfile) throw ApiError.notFound('Parent profile not found');

    await validateReferences(data);

    const demoRequest = await prisma.demoRequest.create({
      data: {
        parentId: parentProfile.id,
        parentName: `${parentProfile.firstName} ${parentProfile.lastName}`,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        childFirstName: data.childFirstName,
        childLastName: data.childLastName,
        childDateOfBirth: data.childDateOfBirth ? new Date(data.childDateOfBirth) : undefined,
        boardId: data.boardId,
        gradeId: data.gradeId,
        preferredTimeSlot: data.preferredTimeSlot,
        preferredDate: new Date(data.preferredDate),
        alternativeDate: data.alternativeDate ? new Date(data.alternativeDate) : undefined,
        notes: data.notes,
        subjects: {
          create: data.subjectIds.map((subjectId) => ({ subjectId })),
        },
      },
      include: demoRequestInclude,
    });

    return formatDemoRequest(demoRequest as unknown as Record<string, unknown>);
  }

  // ==========================================
  // PARENT: List own demo requests
  // ==========================================
  async listMine(userId: string, query: DemoRequestQueryDTO) {
    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parentProfile) throw ApiError.notFound('Parent profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { parentId: parentProfile.id };
    if (query.status) where.status = query.status;

    const [requests, total] = await Promise.all([
      prisma.demoRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: demoRequestInclude,
      }),
      prisma.demoRequest.count({ where }),
    ]);

    return {
      data: requests.map((r) => formatDemoRequest(r as unknown as Record<string, unknown>)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ==========================================
  // Get single demo request (access-controlled)
  // ==========================================
  async getById(userId: string, userRole: Role, demoRequestId: string) {
    const dr = await prisma.demoRequest.findUnique({
      where: { id: demoRequestId },
      include: demoRequestInclude,
    });

    if (!dr) throw ApiError.notFound('Demo request not found');

    // Access control
    if (userRole === Role.PARENT) {
      const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
      if (!parentProfile || dr.parentId !== parentProfile.id) {
        throw ApiError.forbidden('You can only view your own demo requests');
      }
    } else if (userRole === Role.CONSULTANT) {
      const consultantProfile = await prisma.consultantProfile.findUnique({ where: { userId } });
      // Consultants can view PENDING (unassigned) or their own assigned
      if (dr.status !== DemoRequestStatus.PENDING && dr.consultantId !== consultantProfile?.id) {
        throw ApiError.forbidden('You can only view pending or your assigned requests');
      }
    }
    // ADMIN / SUPER_ADMIN can view all

    return formatDemoRequest(dr as unknown as Record<string, unknown>);
  }

  // ==========================================
  // PARENT: Cancel own request
  // ==========================================
  async cancel(userId: string, demoRequestId: string) {
    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parentProfile) throw ApiError.notFound('Parent profile not found');

    const dr = await prisma.demoRequest.findUnique({ where: { id: demoRequestId } });
    if (!dr) throw ApiError.notFound('Demo request not found');
    if (dr.parentId !== parentProfile.id) throw ApiError.forbidden('You can only cancel your own requests');

    if (dr.status !== DemoRequestStatus.PENDING && dr.status !== DemoRequestStatus.ASSIGNED) {
      throw ApiError.badRequest('INVALID_STATUS', 'Can only cancel PENDING or ASSIGNED requests');
    }

    const updated = await prisma.demoRequest.update({
      where: { id: demoRequestId },
      data: { status: DemoRequestStatus.CANCELLED },
      include: demoRequestInclude,
    });

    return formatDemoRequest(updated as unknown as Record<string, unknown>);
  }

  // ==========================================
  // CONSULTANT: List requests
  // ==========================================
  async listForConsultant(userId: string, query: DemoRequestQueryDTO) {
    const consultantProfile = await prisma.consultantProfile.findUnique({ where: { userId } });
    if (!consultantProfile) throw ApiError.notFound('Consultant profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    // Consultants see: all PENDING + their own assigned/confirmed/completed
    const where = query.status
      ? query.status === DemoRequestStatus.PENDING
        ? { status: DemoRequestStatus.PENDING }
        : { status: query.status, consultantId: consultantProfile.id }
      : {
          OR: [
            { status: DemoRequestStatus.PENDING },
            { consultantId: consultantProfile.id },
          ],
        };

    const [requests, total] = await Promise.all([
      prisma.demoRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: demoRequestInclude,
      }),
      prisma.demoRequest.count({ where }),
    ]);

    return {
      data: requests.map((r) => formatDemoRequest(r as unknown as Record<string, unknown>)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ==========================================
  // CONSULTANT: Self-assign a PENDING request
  // ==========================================
  async assignToMe(userId: string, demoRequestId: string) {
    const consultantProfile = await prisma.consultantProfile.findUnique({ where: { userId } });
    if (!consultantProfile) throw ApiError.notFound('Consultant profile not found');

    const dr = await prisma.demoRequest.findUnique({ where: { id: demoRequestId } });
    if (!dr) throw ApiError.notFound('Demo request not found');

    if (dr.status !== DemoRequestStatus.PENDING) {
      throw ApiError.badRequest('INVALID_STATUS', 'Can only assign PENDING requests');
    }

    const updated = await prisma.demoRequest.update({
      where: { id: demoRequestId },
      data: {
        status: DemoRequestStatus.ASSIGNED,
        consultantId: consultantProfile.id,
      },
      include: demoRequestInclude,
    });

    return formatDemoRequest(updated as unknown as Record<string, unknown>);
  }

  // ==========================================
  // CONSULTANT/ADMIN: Update status
  // ==========================================
  async updateStatus(userId: string, userRole: Role, demoRequestId: string, newStatus: DemoRequestStatus) {
    const dr = await prisma.demoRequest.findUnique({ where: { id: demoRequestId } });
    if (!dr) throw ApiError.notFound('Demo request not found');

    // Validate transition
    const allowed = VALID_TRANSITIONS[dr.status];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(
        'INVALID_TRANSITION',
        `Cannot transition from ${dr.status} to ${newStatus}`
      );
    }

    // Consultant can only update their own assigned requests
    if (userRole === Role.CONSULTANT) {
      const consultantProfile = await prisma.consultantProfile.findUnique({ where: { userId } });
      if (!consultantProfile || dr.consultantId !== consultantProfile.id) {
        throw ApiError.forbidden('You can only update status of your assigned requests');
      }
    }

    const updated = await prisma.demoRequest.update({
      where: { id: demoRequestId },
      data: { status: newStatus },
      include: demoRequestInclude,
    });

    return formatDemoRequest(updated as unknown as Record<string, unknown>);
  }

  // ==========================================
  // ADMIN: List all demo requests
  // ==========================================
  async listAll(query: DemoRequestQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [requests, total] = await Promise.all([
      prisma.demoRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: demoRequestInclude,
      }),
      prisma.demoRequest.count({ where }),
    ]);

    return {
      data: requests.map((r) => formatDemoRequest(r as unknown as Record<string, unknown>)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
