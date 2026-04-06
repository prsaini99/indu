import { TokenType } from '@prisma/client';
import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import {
  UpdateTutorProfileDTO,
  CreateCertificationDTO,
  AdminUpdateTutorDTO,
  AdminAssignCourseDTO,
  CreateAvailabilityTemplateDTO,
  CreateBlockedDateDTO,
  TutorSearchQuery,
  ComputedSlot,
} from './tutor.types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class TutorService {
  // ==========================================
  // HELPERS
  // ==========================================

  private async getProfileByUserId(userId: string) {
    const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Tutor profile not found');
    return profile;
  }

  private async getProfileById(id: string) {
    const profile = await prisma.tutorProfile.findUnique({ where: { id } });
    if (!profile) throw ApiError.notFound('Tutor profile not found');
    return profile;
  }

  // ==========================================
  // M3: PUBLIC — TUTOR DIRECTORY
  // ==========================================

  async searchTutors(query: TutorSearchQuery) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { isActive: true, deletedAt: null };

    // Filter by subject and/or grade (via courses)
    if (query.subject || query.grade) {
      const courseFilter: Record<string, unknown> = {};
      if (query.subject) courseFilter.subjectId = query.subject;
      if (query.grade) courseFilter.gradeId = query.grade;
      where.courses = { some: { course: courseFilter } };
    }

    // Search by name
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Determine sort order
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (query.sort === 'experience') orderBy = { experience: 'desc' };
    else if (query.sort === 'name') orderBy = { firstName: 'asc' };

    const [tutors, total] = await Promise.all([
      prisma.tutorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
          bio: true,
          experience: true,
          courses: {
            include: {
              course: {
                include: {
                  subject: { select: { id: true, name: true } },
                  grade: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    const formatted = tutors.map((t) => ({
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      profilePhotoUrl: t.profilePhotoUrl,
      bio: t.bio,
      experience: t.experience,
      rating: null, // M15: Reviews not implemented yet
      totalReviews: 0,
      courses: t.courses.map((tc) => ({
        id: tc.course.id,
        name: tc.course.name,
        subject: tc.course.subject,
        grade: tc.course.grade,
        tutorRate: tc.tutorRate,
      })),
    }));

    return { data: formatted, meta: buildPaginationMeta(page, limit, total) };
  }

  async getTutorPublicProfile(tutorProfileId: string) {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: {
        courses: {
          include: {
            course: {
              include: {
                subject: { select: { id: true, name: true } },
                grade: { select: { id: true, name: true } },
              },
            },
          },
        },
        certifications: {
          select: { id: true, title: true, institution: true, year: true },
        },
      },
    });

    if (!tutor || !tutor.isActive || tutor.deletedAt) {
      throw ApiError.notFound('Tutor not found');
    }

    return {
      id: tutor.id,
      firstName: tutor.firstName,
      lastName: tutor.lastName,
      profilePhotoUrl: tutor.profilePhotoUrl,
      introVideoUrl: tutor.introVideoUrl,
      bio: tutor.bio,
      experience: tutor.experience,
      rating: null,
      totalReviews: 0,
      courses: tutor.courses.map((tc) => ({
        id: tc.course.id,
        name: tc.course.name,
        subject: tc.course.subject,
        grade: tc.course.grade,
        tutorRate: tc.tutorRate,
      })),
      certifications: tutor.certifications,
    };
  }

  // ==========================================
  // M3: TUTOR SELF-MANAGEMENT
  // ==========================================

  async getOwnProfile(userId: string) {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId },
      include: {
        courses: {
          include: {
            course: {
              include: {
                subject: { select: { id: true, name: true } },
                grade: { select: { id: true, name: true } },
              },
            },
          },
        },
        certifications: true,
        user: { select: { email: true, isActive: true, lastLoginAt: true } },
      },
    });

    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    return {
      id: tutor.id,
      userId: tutor.userId,
      email: tutor.user.email,
      firstName: tutor.firstName,
      lastName: tutor.lastName,
      phone: tutor.phone,
      bio: tutor.bio,
      experience: tutor.experience,
      profilePhotoUrl: tutor.profilePhotoUrl,
      introVideoUrl: tutor.introVideoUrl,
      isActive: tutor.isActive,
      courses: tutor.courses.map((tc) => ({
        id: tc.id,
        courseId: tc.course.id,
        courseName: tc.course.name,
        subject: tc.course.subject,
        grade: tc.course.grade,
        tutorRate: tc.tutorRate,
      })),
      certifications: tutor.certifications,
      lastLoginAt: tutor.user.lastLoginAt,
    };
  }

  async updateOwnProfile(userId: string, data: UpdateTutorProfileDTO) {
    const profile = await this.getProfileByUserId(userId);

    const updated = await prisma.tutorProfile.update({
      where: { id: profile.id },
      data,
    });

    return {
      id: updated.id,
      bio: updated.bio,
      phone: updated.phone,
      experience: updated.experience,
      profilePhotoUrl: updated.profilePhotoUrl,
      introVideoUrl: updated.introVideoUrl,
    };
  }

  async getMyStudents(_userId: string) {
    // Placeholder — no student-tutor assignment model exists yet
    return [];
  }

  async getDashboardSummary(userId: string) {
    const profile = await this.getProfileByUserId(userId);

    const coursesCount = await prisma.tutorCourse.count({
      where: { tutorId: profile.id },
    });

    return {
      totalStudents: 0,
      upcomingSessions: 0,
      completedSessions: 0,
      totalEarnings: 0,
      averageRating: null,
      coursesCount,
    };
  }

  // ==========================================
  // M3: CERTIFICATIONS
  // ==========================================

  async getOwnCertifications(userId: string) {
    const profile = await this.getProfileByUserId(userId);

    return prisma.tutorCertification.findMany({
      where: { tutorId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addCertification(userId: string, data: CreateCertificationDTO) {
    const profile = await this.getProfileByUserId(userId);

    return prisma.tutorCertification.create({
      data: {
        tutorId: profile.id,
        title: data.title,
        institution: data.institution,
        year: data.year,
        documentUrl: data.documentUrl,
      },
    });
  }

  async deleteCertification(userId: string, certId: string) {
    const profile = await this.getProfileByUserId(userId);

    const cert = await prisma.tutorCertification.findUnique({
      where: { id: certId },
    });
    if (!cert || cert.tutorId !== profile.id) {
      throw ApiError.notFound('Certification not found');
    }

    await prisma.tutorCertification.delete({ where: { id: certId } });
    return { message: 'Certification removed' };
  }

  // ==========================================
  // M3: ADMIN TUTOR MANAGEMENT
  // ==========================================

  async adminListTutors(query: TutorSearchQuery) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { deletedAt: null };

    if (query.subject || query.grade) {
      const courseFilter: Record<string, unknown> = {};
      if (query.subject) courseFilter.subjectId = query.subject;
      if (query.grade) courseFilter.gradeId = query.grade;
      where.courses = { some: { course: courseFilter } };
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (query.sort === 'experience') orderBy = { experience: 'desc' };
    else if (query.sort === 'name') orderBy = { firstName: 'asc' };

    const [tutors, total] = await Promise.all([
      prisma.tutorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: { email: true, isActive: true, lastLoginAt: true } },
          courses: {
            include: {
              course: {
                include: {
                  subject: { select: { id: true, name: true } },
                  grade: { select: { id: true, name: true } },
                },
              },
            },
          },
          _count: { select: { certifications: true } },
        },
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    const formatted = tutors.map((t) => ({
      id: t.id,
      userId: t.userId,
      email: t.user.email,
      firstName: t.firstName,
      lastName: t.lastName,
      phone: t.phone,
      bio: t.bio,
      experience: t.experience,
      profilePhotoUrl: t.profilePhotoUrl,
      isActive: t.isActive,
      lastLoginAt: t.user.lastLoginAt,
      certificationsCount: t._count.certifications,
      courses: t.courses.map((tc) => ({
        id: tc.course.id,
        name: tc.course.name,
        subject: tc.course.subject,
        grade: tc.course.grade,
        tutorRate: tc.tutorRate,
      })),
    }));

    return { data: formatted, meta: buildPaginationMeta(page, limit, total) };
  }

  async adminUpdateTutor(tutorProfileId: string, data: AdminUpdateTutorDTO) {
    await this.getProfileById(tutorProfileId);

    const updated = await prisma.tutorProfile.update({
      where: { id: tutorProfileId },
      data,
    });

    return {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      bio: updated.bio,
      experience: updated.experience,
      profilePhotoUrl: updated.profilePhotoUrl,
    };
  }

  async adminToggleTutorStatus(tutorProfileId: string, isActive: boolean) {
    const profile = await this.getProfileById(tutorProfileId);

    // Update both TutorProfile and User
    await prisma.$transaction(async (tx) => {
      await tx.tutorProfile.update({
        where: { id: tutorProfileId },
        data: { isActive },
      });

      await tx.user.update({
        where: { id: profile.userId },
        data: { isActive },
      });

      // If deactivating, invalidate session
      if (!isActive) {
        await tx.token.deleteMany({
          where: { userId: profile.userId, type: TokenType.REFRESH },
        });
      }
    });

    return { message: `Tutor ${isActive ? 'activated' : 'deactivated'} successfully` };
  }

  async softDeleteTutor(tutorProfileId: string) {
    const profile = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
    if (!profile || profile.deletedAt) throw ApiError.notFound('Tutor not found');

    await prisma.$transaction(async (tx) => {
      await tx.tutorProfile.update({
        where: { id: tutorProfileId },
        data: { deletedAt: new Date(), isActive: false },
      });

      await tx.user.update({
        where: { id: profile.userId },
        data: { isActive: false },
      });

      // Invalidate sessions
      await tx.token.deleteMany({
        where: { userId: profile.userId, type: TokenType.REFRESH },
      });
    });

    return { message: 'Tutor deleted' };
  }

  async adminGetPerformance(tutorProfileId: string) {
    await this.getProfileById(tutorProfileId);

    // Placeholder — no sessions/ratings/earnings models yet
    return {
      totalSessions: 0,
      completedSessions: 0,
      cancelledSessions: 0,
      averageRating: null,
      totalEarnings: 0,
    };
  }

  async adminAssignCourse(tutorProfileId: string, data: AdminAssignCourseDTO) {
    await this.getProfileById(tutorProfileId);

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course || course.deletedAt) throw ApiError.badRequest('INVALID_COURSE', 'Course not found');

    // Check for duplicate
    const existing = await prisma.tutorCourse.findUnique({
      where: { tutorId_courseId: { tutorId: tutorProfileId, courseId: data.courseId } },
    });
    if (existing) {
      throw ApiError.conflict('DUPLICATE_ENTRY', 'Course already assigned to this tutor');
    }

    const assignment = await prisma.tutorCourse.create({
      data: {
        tutorId: tutorProfileId,
        courseId: data.courseId,
        tutorRate: data.tutorRate,
      },
      include: {
        course: {
          include: {
            subject: { select: { name: true } },
            grade: { select: { name: true } },
          },
        },
      },
    });

    return {
      tutorId: tutorProfileId,
      courseId: assignment.courseId,
      courseName: assignment.course.name,
      tutorRate: assignment.tutorRate,
    };
  }

  async adminRemoveCourse(tutorProfileId: string, courseId: string) {
    await this.getProfileById(tutorProfileId);

    const assignment = await prisma.tutorCourse.findUnique({
      where: { tutorId_courseId: { tutorId: tutorProfileId, courseId } },
    });
    if (!assignment) {
      throw ApiError.notFound('Course assignment not found');
    }

    await prisma.tutorCourse.delete({
      where: { tutorId_courseId: { tutorId: tutorProfileId, courseId } },
    });

    return { message: 'Course assignment removed' };
  }

  // ==========================================
  // M5: AVAILABILITY TEMPLATES
  // ==========================================

  async getTemplates(userId: string) {
    const profile = await this.getProfileByUserId(userId);

    const templates = await prisma.availabilityTemplate.findMany({
      where: { tutorId: profile.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return templates.map((t) => ({
      id: t.id,
      dayOfWeek: t.dayOfWeek,
      dayName: DAY_NAMES[t.dayOfWeek],
      startTime: t.startTime,
      endTime: t.endTime,
    }));
  }

  async createTemplate(userId: string, data: CreateAvailabilityTemplateDTO) {
    const profile = await this.getProfileByUserId(userId);

    // Check if any blocked dates fall on this day-of-week
    const blockedDates = await prisma.blockedDate.findMany({
      where: { tutorId: profile.id },
    });
    const conflictingBlocked = blockedDates.find((bd) => {
      return bd.date.getUTCDay() === data.dayOfWeek;
    });
    if (conflictingBlocked) {
      const blockedDateStr = conflictingBlocked.date.toISOString().split('T')[0];
      throw ApiError.conflict(
        'BLOCKED_DATE_CONFLICT',
        `You have blocked ${blockedDateStr} (${DAY_NAMES[data.dayOfWeek]}). Remove the blocked date first before adding a slot for this day.`
      );
    }

    // Check for time overlap on the same day
    const existingTemplates = await prisma.availabilityTemplate.findMany({
      where: { tutorId: profile.id, dayOfWeek: data.dayOfWeek },
    });

    for (const existing of existingTemplates) {
      // Overlap: newStart < existingEnd AND newEnd > existingStart
      if (data.startTime < existing.endTime && data.endTime > existing.startTime) {
        throw ApiError.conflict(
          'OVERLAP',
          `Time overlaps with existing template ${existing.startTime}-${existing.endTime} on ${DAY_NAMES[data.dayOfWeek]}`
        );
      }
    }

    const template = await prisma.availabilityTemplate.create({
      data: {
        tutorId: profile.id,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    return {
      id: template.id,
      dayOfWeek: template.dayOfWeek,
      dayName: DAY_NAMES[template.dayOfWeek],
      startTime: template.startTime,
      endTime: template.endTime,
    };
  }

  async deleteTemplate(userId: string, templateId: string) {
    const profile = await this.getProfileByUserId(userId);

    const template = await prisma.availabilityTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template || template.tutorId !== profile.id) {
      throw ApiError.notFound('Availability template not found');
    }

    await prisma.availabilityTemplate.delete({ where: { id: templateId } });
    return { message: 'Availability template removed' };
  }

  // ==========================================
  // M5: BLOCKED DATES
  // ==========================================

  async getBlockedDates(userId: string) {
    const profile = await this.getProfileByUserId(userId);

    const dates = await prisma.blockedDate.findMany({
      where: { tutorId: profile.id },
      orderBy: { date: 'asc' },
    });

    return dates.map((d) => ({
      id: d.id,
      date: d.date.toISOString().split('T')[0],
      reason: d.reason,
    }));
  }

  async createBlockedDate(userId: string, data: CreateBlockedDateDTO) {
    const profile = await this.getProfileByUserId(userId);

    const dateObj = new Date(data.date + 'T00:00:00');

    // Must block at least 24 hours before the date
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    if (diffMs < 24 * 60 * 60 * 1000) {
      throw ApiError.badRequest(
        'TOO_LATE',
        'You must block a date at least 24 hours in advance.'
      );
    }

    // Check for duplicate
    const existing = await prisma.blockedDate.findUnique({
      where: { tutorId_date: { tutorId: profile.id, date: new Date(data.date) } },
    });
    if (existing) {
      throw ApiError.conflict('DUPLICATE_ENTRY', 'This date is already blocked');
    }

    const blocked = await prisma.blockedDate.create({
      data: {
        tutorId: profile.id,
        date: new Date(data.date),
        reason: data.reason,
      },
    });

    return {
      id: blocked.id,
      date: blocked.date.toISOString().split('T')[0],
      reason: blocked.reason,
    };
  }

  async deleteBlockedDate(userId: string, blockedDateId: string) {
    const profile = await this.getProfileByUserId(userId);

    const blocked = await prisma.blockedDate.findUnique({
      where: { id: blockedDateId },
    });
    if (!blocked || blocked.tutorId !== profile.id) {
      throw ApiError.notFound('Blocked date not found');
    }

    await prisma.blockedDate.delete({ where: { id: blockedDateId } });
    return { message: 'Blocked date removed' };
  }

  // ==========================================
  // M5: COMPUTE AVAILABILITY
  // ==========================================

  async computeAvailability(tutorProfileId: string, startDate: string, endDate: string) {
    const profile = await this.getProfileById(tutorProfileId);

    if (!profile.isActive) {
      throw ApiError.notFound('Tutor not found');
    }

    const tutorUser = await prisma.user.findUnique({
      where: { id: profile.userId },
      select: { timezone: true },
    });

    // Cap at 30 days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      throw ApiError.badRequest('RANGE_TOO_LARGE', 'Date range cannot exceed 30 days');
    }

    // Fetch templates and blocked dates
    const [templates, blockedDates] = await Promise.all([
      prisma.availabilityTemplate.findMany({
        where: { tutorId: tutorProfileId },
      }),
      prisma.blockedDate.findMany({
        where: {
          tutorId: tutorProfileId,
          date: { gte: start, lte: end },
        },
      }),
    ]);

    // Build a Set of blocked date strings
    const blockedSet = new Set(
      blockedDates.map((d) => d.date.toISOString().split('T')[0])
    );

    // Group templates by dayOfWeek for fast lookup
    const templatesByDay = new Map<number, typeof templates>();
    for (const t of templates) {
      const arr = templatesByDay.get(t.dayOfWeek) || [];
      arr.push(t);
      templatesByDay.set(t.dayOfWeek, arr);
    }

    // Iterate each day in range
    const slots: ComputedSlot[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay(); // 0=Sunday

      if (!blockedSet.has(dateStr)) {
        const dayTemplates = templatesByDay.get(dayOfWeek) || [];
        for (const t of dayTemplates) {
          slots.push({
            date: dateStr,
            dayName: DAY_NAMES[dayOfWeek],
            dayOfWeek,
            startTime: t.startTime,
            endTime: t.endTime,
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    // Build blocked info for the queried range
    const blockedInfo = blockedDates.map((d) => ({
      date: d.date.toISOString().split('T')[0],
      reason: d.reason,
    }));

    return { slots, blockedDates: blockedInfo, tutorTimezone: tutorUser?.timezone || 'Asia/Kolkata' };
  }
}
