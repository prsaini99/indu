import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { CreateApplicationDTO, ReviewApplicationDTO, ApplicationQueryDTO } from './application.types';

class ApplicationService {
  // Public: submit an application (no auth required)
  async create(data: CreateApplicationDTO) {
    // Check for duplicate pending application with same email + role
    const existing = await prisma.application.findFirst({
      where: {
        email: data.email,
        role: data.role,
        status: 'PENDING',
      },
    });
    if (existing) {
      throw ApiError.badRequest(
        'DUPLICATE_APPLICATION',
        'You already have a pending application for this role. Please wait for it to be reviewed.'
      );
    }

    const application = await prisma.application.create({
      data: {
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        experience: data.experience ?? 0,
        bio: data.bio,
        resumeUrl: data.resumeUrl,
        subjects: data.subjects,
        qualifications: data.qualifications,
      },
    });

    return application;
  }

  // Admin: list all applications with filters
  async listAll(query: ApplicationQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.role) where.role = query.role;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);

    return {
      data: applications,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // Admin: get single application
  async getById(id: string) {
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) throw ApiError.notFound('Application not found');
    return application;
  }

  // Admin: review (approve/reject) an application
  async review(id: string, adminUserId: string, data: ReviewApplicationDTO) {
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) throw ApiError.notFound('Application not found');

    if (application.status === 'APPROVED' || application.status === 'REJECTED') {
      throw ApiError.badRequest('ALREADY_REVIEWED', `This application has already been ${application.status.toLowerCase()}.`);
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: data.status,
        reviewNote: data.reviewNote,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });

    return updated;
  }
}

export const applicationService = new ApplicationService();
