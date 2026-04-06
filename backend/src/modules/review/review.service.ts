import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { CreateReviewDTO, ReviewQueryDTO, UpdateVisibilityDTO } from './review.types';

export class ReviewService {
  // ==========================================
  // PARENT: SUBMIT REVIEW
  // ==========================================

  async create(userId: string, data: CreateReviewDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    // Find session and verify it's COMPLETED and belongs to this parent
    const session = await prisma.enrollmentSession.findUnique({
      where: { id: data.bookingId },
      include: {
        enrollment: {
          select: { parentId: true, tutorId: true, subject: { select: { name: true } } },
        },
        review: { select: { id: true } },
      },
    });

    if (!session) throw ApiError.notFound('Session not found');
    if (session.enrollment.parentId !== parent.id) {
      throw ApiError.forbidden('You can only review your own sessions');
    }
    if (session.status !== 'COMPLETED') {
      throw ApiError.badRequest('SESSION_NOT_COMPLETED', 'You can only review completed sessions');
    }
    if (session.review) {
      throw ApiError.conflict('REVIEW_EXISTS', 'A review already exists for this session');
    }

    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        tutorId: session.enrollment.tutorId,
        parentId: parent.id,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        tutor: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      tutor: { firstName: review.tutor.firstName, lastName: review.tutor.lastName },
      createdAt: review.createdAt,
    };
  }

  // ==========================================
  // PARENT: LIST OWN REVIEWS
  // ==========================================

  async listByParent(userId: string, query: ReviewQueryDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { parentId: parent.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tutor: { select: { firstName: true, lastName: true } },
          booking: {
            include: {
              enrollment: {
                select: { subject: { select: { name: true } } },
              },
            },
          },
        },
      }),
      prisma.review.count({ where: { parentId: parent.id } }),
    ]);

    const data = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      tutorName: `${r.tutor.firstName} ${r.tutor.lastName}`,
      subject: r.booking.enrollment.subject.name,
      classDate: r.booking.scheduledDate,
      createdAt: r.createdAt,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // PUBLIC: TUTOR REVIEWS + AGGREGATE
  // ==========================================

  async listByTutor(tutorId: string, query: ReviewQueryDTO) {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: tutorId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!tutor) throw ApiError.notFound('Tutor not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    // Only visible reviews for public
    const where = { tutorId, isVisible: true };

    const [reviews, total, allRatings] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: { select: { firstName: true, lastName: true } },
          booking: {
            include: {
              enrollment: {
                select: { subject: { select: { name: true } } },
              },
            },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        select: { rating: true },
      }),
    ]);

    // Compute aggregate
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    for (const r of allRatings) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      ratingSum += r.rating;
    }
    const aggregateRating = allRatings.length > 0 ? Math.round((ratingSum / allRatings.length) * 10) / 10 : null;

    const data = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      parentName: `${r.parent.firstName} ${r.parent.lastName}`,
      subject: r.booking.enrollment.subject.name,
      createdAt: r.createdAt,
    }));

    return {
      tutorId: tutor.id,
      aggregateRating,
      totalReviews: allRatings.length,
      distribution,
      reviews: data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ==========================================
  // TUTOR: LIST OWN REVIEWS
  // ==========================================

  async listForOwnTutor(userId: string, query: ReviewQueryDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const [reviews, total, allRatings] = await Promise.all([
      prisma.review.findMany({
        where: { tutorId: tutor.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: { select: { firstName: true, lastName: true } },
          booking: {
            include: {
              enrollment: {
                select: { subject: { select: { name: true } } },
              },
            },
          },
        },
      }),
      prisma.review.count({ where: { tutorId: tutor.id } }),
      prisma.review.findMany({
        where: { tutorId: tutor.id },
        select: { rating: true },
      }),
    ]);

    // Aggregate from ALL reviews (tutor sees full picture including hidden)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    for (const r of allRatings) {
      distribution[r.rating]++;
      ratingSum += r.rating;
    }
    const aggregateRating = allRatings.length > 0 ? Math.round((ratingSum / allRatings.length) * 10) / 10 : null;

    const data = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      parentName: `${r.parent.firstName} ${r.parent.lastName}`,
      subject: r.booking.enrollment.subject.name,
      classDate: r.booking.scheduledDate,
      isVisible: r.isVisible,
      createdAt: r.createdAt,
    }));

    return {
      aggregateRating,
      totalReviews: allRatings.length,
      distribution,
      reviews: data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ==========================================
  // ADMIN: LIST ALL REVIEWS
  // ==========================================

  async listAll(query: ReviewQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.tutorId) where.tutorId = query.tutorId;
    if (query.isVisible !== undefined) where.isVisible = query.isVisible === 'true';

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tutor: { select: { firstName: true, lastName: true } },
          parent: { select: { firstName: true, lastName: true } },
          booking: {
            include: {
              enrollment: {
                select: { subject: { select: { name: true } } },
              },
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    const data = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      tutorName: `${r.tutor.firstName} ${r.tutor.lastName}`,
      parentName: `${r.parent.firstName} ${r.parent.lastName}`,
      subject: r.booking.enrollment.subject.name,
      isVisible: r.isVisible,
      createdAt: r.createdAt,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // ADMIN: UPDATE VISIBILITY
  // ==========================================

  async updateVisibility(reviewId: string, data: UpdateVisibilityDTO) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw ApiError.notFound('Review not found');

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { isVisible: data.isVisible },
    });

    return { id: updated.id, isVisible: updated.isVisible };
  }
}
