import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import {
  CreateCourseDTO,
  UpdateCourseDTO,
  CourseSearchQuery,
  CreateCourseMaterialDTO,
  UpdateGradeTierDTO,
} from './course.types';

export class CourseService {
  // ==========================================
  // PUBLIC: COURSE LISTING
  // ==========================================

  async listCourses(query: CourseSearchQuery) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { isActive: true, deletedAt: null };

    if (query.subject) {
      where.subjectId = query.subject;
    }
    if (query.grade) {
      where.gradeId = query.grade;
    }
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          subject: { select: { id: true, name: true } },
          grade: {
            select: {
              id: true,
              name: true,
              tier: { select: { creditsPerClass: true } },
            },
          },
          _count: { select: { tutors: true, materials: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const formatted = courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      subject: c.subject,
      grade: { id: c.grade.id, name: c.grade.name },
      creditsPerClass: c.grade.tier.creditsPerClass,
      tutorsCount: c._count.tutors,
      materialsCount: c._count.materials,
      isActive: c.isActive,
    }));

    return { data: formatted, meta: buildPaginationMeta(page, limit, total) };
  }

  async adminListCourses(query: CourseSearchQuery) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { deletedAt: null };

    if (query.subject) {
      where.subjectId = query.subject;
    }
    if (query.grade) {
      where.gradeId = query.grade;
    }
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          subject: { select: { id: true, name: true } },
          grade: {
            select: {
              id: true,
              name: true,
              tier: { select: { creditsPerClass: true } },
            },
          },
          _count: { select: { tutors: true, materials: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const formatted = courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      subject: c.subject,
      grade: { id: c.grade.id, name: c.grade.name },
      creditsPerClass: c.grade.tier.creditsPerClass,
      tutorsCount: c._count.tutors,
      materialsCount: c._count.materials,
      isActive: c.isActive,
    }));

    return { data: formatted, meta: buildPaginationMeta(page, limit, total) };
  }

  async getCourseDetail(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        subject: { select: { id: true, name: true } },
        grade: {
          select: {
            id: true,
            name: true,
            tier: { select: { id: true, name: true, creditsPerClass: true } },
          },
        },
        materials: {
          select: { id: true, title: true, fileUrl: true, fileType: true, fileSizeKb: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        tutors: {
          include: {
            tutor: {
              select: { id: true, firstName: true, lastName: true, experience: true, profilePhotoUrl: true },
            },
          },
        },
      },
    });

    if (!course || course.deletedAt) {
      throw ApiError.notFound('Course not found');
    }

    return {
      id: course.id,
      name: course.name,
      description: course.description,
      subject: course.subject,
      grade: { id: course.grade.id, name: course.grade.name },
      gradeTier: course.grade.tier,
      isActive: course.isActive,
      materials: course.materials,
      tutors: course.tutors.map((tc) => tc.tutor),
    };
  }

  // ==========================================
  // ADMIN: COURSE CRUD
  // ==========================================

  async createCourse(data: CreateCourseDTO) {
    // Verify subject exists
    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) throw ApiError.badRequest('INVALID_SUBJECT', 'Subject not found');

    // Verify grade exists
    const grade = await prisma.gradeLevel.findUnique({
      where: { id: data.gradeId },
      include: { tier: true },
    });
    if (!grade) throw ApiError.badRequest('INVALID_GRADE', 'Grade level not found');

    // Check uniqueness
    const existing = await prisma.course.findUnique({
      where: { subjectId_gradeId: { subjectId: data.subjectId, gradeId: data.gradeId } },
    });
    if (existing) {
      throw ApiError.conflict('DUPLICATE_ENTRY', `Course for ${subject.name} — ${grade.name} already exists`);
    }

    const course = await prisma.course.create({
      data: {
        subjectId: data.subjectId,
        gradeId: data.gradeId,
        name: data.name,
        description: data.description,
      },
      include: {
        subject: { select: { id: true, name: true } },
        grade: {
          select: {
            id: true,
            name: true,
            tier: { select: { name: true, creditsPerClass: true } },
          },
        },
      },
    });

    return {
      id: course.id,
      name: course.name,
      subject: course.subject,
      grade: { id: course.grade.id, name: course.grade.name },
      gradeTier: course.grade.tier,
    };
  }

  async updateCourse(courseId: string, data: UpdateCourseDTO) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) throw ApiError.notFound('Course not found');

    const updated = await prisma.course.update({
      where: { id: courseId },
      data,
      include: {
        subject: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      isActive: updated.isActive,
      subject: updated.subject,
      grade: updated.grade,
    };
  }

  async softDeleteCourse(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) throw ApiError.notFound('Course not found');

    await prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Course deleted' };
  }

  // ==========================================
  // ADMIN: COURSE MATERIALS
  // ==========================================

  async addMaterial(courseId: string, data: CreateCourseMaterialDTO) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) throw ApiError.notFound('Course not found');

    return prisma.courseMaterial.create({
      data: {
        courseId,
        title: data.title,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSizeKb: data.fileSizeKb,
      },
    });
  }

  async removeMaterial(courseId: string, materialId: string) {
    const material = await prisma.courseMaterial.findUnique({ where: { id: materialId } });
    if (!material || material.courseId !== courseId) {
      throw ApiError.notFound('Course material not found');
    }

    await prisma.courseMaterial.delete({ where: { id: materialId } });
    return { message: 'Material removed' };
  }

  // ==========================================
  // TUTOR: MY COURSES & MATERIALS
  // ==========================================

  async listTutorCourses(userId: string) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const assignments = await prisma.tutorCourse.findMany({
      where: { tutorId: tutor.id },
      include: {
        course: {
          include: {
            subject: { select: { id: true, name: true } },
            grade: { select: { id: true, name: true } },
            materials: {
              select: { id: true, title: true, fileUrl: true, fileType: true, fileSizeKb: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    return assignments
      .filter((a) => !a.course.deletedAt && a.course.isActive)
      .map((a) => ({
        id: a.course.id,
        name: a.course.name,
        description: a.course.description,
        subject: a.course.subject,
        grade: a.course.grade,
        isActive: a.course.isActive,
        materials: a.course.materials,
      }));
  }

  async tutorAddMaterial(userId: string, courseId: string, data: CreateCourseMaterialDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    // Verify tutor is assigned to this course
    const assignment = await prisma.tutorCourse.findUnique({
      where: { tutorId_courseId: { tutorId: tutor.id, courseId } },
    });
    if (!assignment) throw ApiError.forbidden('You are not assigned to this course');

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) throw ApiError.notFound('Course not found');

    return prisma.courseMaterial.create({
      data: {
        courseId,
        title: data.title,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSizeKb: data.fileSizeKb,
      },
    });
  }

  async tutorRemoveMaterial(userId: string, courseId: string, materialId: string) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    // Verify tutor is assigned to this course
    const assignment = await prisma.tutorCourse.findUnique({
      where: { tutorId_courseId: { tutorId: tutor.id, courseId } },
    });
    if (!assignment) throw ApiError.forbidden('You are not assigned to this course');

    const material = await prisma.courseMaterial.findUnique({ where: { id: materialId } });
    if (!material || material.courseId !== courseId) {
      throw ApiError.notFound('Course material not found');
    }

    await prisma.courseMaterial.delete({ where: { id: materialId } });
    return { message: 'Material removed' };
  }

  // ==========================================
  // ADMIN: GRADE TIERS
  // ==========================================

  async listGradeTiers() {
    const tiers = await prisma.gradeTier.findMany({
      orderBy: { minGrade: 'asc' },
      include: {
        gradeLevels: {
          select: { id: true, name: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return tiers.map((t) => ({
      id: t.id,
      name: t.name,
      creditsPerClass: t.creditsPerClass,
      credits60Min: t.credits60Min,
      credits90Min: t.credits90Min,
      credits120Min: t.credits120Min,
      minGrade: t.minGrade,
      maxGrade: t.maxGrade,
      gradeLevels: t.gradeLevels,
    }));
  }

  async updateGradeTier(tierId: string, data: UpdateGradeTierDTO) {
    const tier = await prisma.gradeTier.findUnique({ where: { id: tierId } });
    if (!tier) throw ApiError.notFound('Grade tier not found');

    const updated = await prisma.gradeTier.update({
      where: { id: tierId },
      data,
    });

    return {
      id: updated.id,
      name: updated.name,
      creditsPerClass: updated.creditsPerClass,
      minGrade: updated.minGrade,
      maxGrade: updated.maxGrade,
    };
  }

  // ==========================================
  // ADMIN: TUTOR-COURSE ASSIGNMENT
  // ==========================================

  async assignTutorToCourse(courseId: string, tutorId: string, tutorRate: number) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) throw ApiError.notFound('Course not found');

    const tutor = await prisma.tutorProfile.findUnique({ where: { id: tutorId } });
    if (!tutor) throw ApiError.notFound('Tutor not found');

    const existing = await prisma.tutorCourse.findUnique({
      where: { tutorId_courseId: { tutorId, courseId } },
    });
    if (existing) {
      throw ApiError.conflict('DUPLICATE_ENTRY', 'Tutor is already assigned to this course');
    }

    await prisma.tutorCourse.create({ data: { tutorId, courseId, tutorRate } });

    return { message: 'Tutor assigned to course' };
  }

  async removeTutorFromCourse(courseId: string, tutorId: string) {
    const assignment = await prisma.tutorCourse.findUnique({
      where: { tutorId_courseId: { tutorId, courseId } },
    });
    if (!assignment) throw ApiError.notFound('Tutor-course assignment not found');

    await prisma.tutorCourse.delete({
      where: { tutorId_courseId: { tutorId, courseId } },
    });

    return { message: 'Tutor removed from course' };
  }
}
