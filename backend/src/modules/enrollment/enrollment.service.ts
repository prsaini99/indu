import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { convertTime, shiftDay, localToUtc, getUtcOffsetMinutes } from '../../shared/utils/timezone';
import { computeBalance } from '../../shared/utils/credit';
import { addMinutesToTime, formatDateUTC } from '../../shared/utils/time';
import {
  CreateEnrollmentDTO,
  EnrollmentQueryDTO,
  SessionQueryDTO,
  CancelSessionDTO,
  ScheduleSlot,
} from './enrollment.types';
import { EarningService } from '../earning/earning.service';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Standard include for enrollment queries
const enrollmentInclude = {
  student: { select: { id: true, firstName: true, lastName: true, gradeId: true, grade: { select: { id: true, name: true } } } },
  parent: { include: { user: { select: { id: true, email: true, timezone: true } } } },
  subject: { select: { id: true, name: true } },
  tutor: { include: { user: { select: { id: true, email: true, timezone: true } } } },
} as const;

const sessionInclude = {
  creditTransaction: { select: { id: true, amount: true, type: true, createdAt: true } },
};

export class EnrollmentService {
  private earningService = new EarningService();

  // ==========================================
  // HELPERS
  // ==========================================

  private async deleteZoomMeeting(enrollment: { zoomMeetingId: bigint | null }) {
    if (!enrollment.zoomMeetingId) return;
    try {
      const { ZoomService } = await import('../zoom/zoom.service');
      const zoom = new ZoomService();
      await zoom.deleteMeeting(enrollment.zoomMeetingId);
    } catch (err) {
      console.error('Zoom meeting deletion failed (non-blocking):', err);
    }
  }

  private getCreditsForDuration(tier: { credits60Min: number; credits90Min: number; credits120Min: number; creditsPerClass: number }, duration: number): number {
    if (duration === 60) return tier.credits60Min || tier.creditsPerClass;
    if (duration === 90) return tier.credits90Min || tier.creditsPerClass;
    if (duration === 120) return tier.credits120Min || tier.creditsPerClass;
    return tier.credits60Min || tier.creditsPerClass; // fallback
  }


  /** Parse the JSON schedule field from DB into typed array */
  private parseSchedule(schedule: unknown): ScheduleSlot[] {
    if (Array.isArray(schedule)) return schedule as ScheduleSlot[];
    if (typeof schedule === 'string') return JSON.parse(schedule);
    return [];
  }

  // ==========================================
  // AVAILABLE SLOTS (for parent to pick from)
  // ==========================================

  async getAvailableSlots(subjectId: string, gradeId: string, duration: number, parentTimezone: string) {
    const tutorCourses = await prisma.tutorCourse.findMany({
      where: {
        course: { subjectId, gradeId, isActive: true },
        tutor: { isActive: true, deletedAt: null },
      },
      include: {
        tutor: {
          select: {
            id: true,
            userId: true,
            availabilityTemplates: true,
          },
        },
      },
    });

    if (tutorCourses.length === 0) {
      return { slots: [], message: 'No tutors available for this subject and grade.' };
    }

    // Deduplicate tutors
    const tutorMap = new Map<string, typeof tutorCourses[0]['tutor']>();
    for (const tc of tutorCourses) {
      if (!tutorMap.has(tc.tutor.id)) {
        tutorMap.set(tc.tutor.id, tc.tutor);
      }
    }

    // Get timezone for each tutor
    const tutorUserIds = [...tutorMap.values()].map((t) => t.userId);
    const tutorUsers = await prisma.user.findMany({
      where: { id: { in: tutorUserIds } },
      select: { id: true, timezone: true },
    });
    const userTzMap = new Map(tutorUsers.map((u) => [u.id, u.timezone]));

    // Merge all availability templates, converted to parent's timezone
    const slotMap = new Map<string, { dayOfWeek: number; startTime: string; endTime: string; tutorCount: number }>();

    for (const [, tutor] of tutorMap) {
      const tutorTz = userTzMap.get(tutor.userId) || 'Asia/Kolkata';

      for (const template of tutor.availabilityTemplates) {
        const templateStartMinutes = this.timeToMinutes(template.startTime);
        const templateEndMinutes = this.timeToMinutes(template.endTime);

        for (let startMin = templateStartMinutes; startMin + duration <= templateEndMinutes; startMin += 30) {
          const slotStart = this.minutesToTime(startMin);
          const slotEnd = this.minutesToTime(startMin + duration);

          const convertedStart = convertTime(slotStart, tutorTz, parentTimezone);
          const convertedEnd = convertTime(slotEnd, tutorTz, parentTimezone);
          const convertedDay = shiftDay(template.dayOfWeek, convertedStart.dayShift);

          const key = `${convertedDay}:${convertedStart.time}`;
          const existing = slotMap.get(key);
          if (existing) {
            existing.tutorCount++;
          } else {
            slotMap.set(key, {
              dayOfWeek: convertedDay,
              startTime: convertedStart.time,
              endTime: convertedEnd.time,
              tutorCount: 1,
            });
          }
        }
      }
    }

    const slots = [...slotMap.values()].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });

    return { slots };
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // ==========================================
  // AUTO-ASSIGN TUTOR
  // ==========================================

  async findMatchingTutor(
    subjectId: string,
    gradeId: string,
    schedule: ScheduleSlot[],
    duration: number,
    parentTimezone: string
  ): Promise<string> {
    const tutorCourses = await prisma.tutorCourse.findMany({
      where: {
        course: { subjectId, gradeId, isActive: true },
        tutor: { isActive: true, deletedAt: null },
      },
      include: {
        tutor: {
          select: {
            id: true,
            userId: true,
            experience: true,
            availabilityTemplates: true,
            _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
    });

    if (tutorCourses.length === 0) {
      throw ApiError.notFound('No tutors available for this subject and grade. Please try a different subject or contact support.');
    }

    const tutorMap = new Map<string, typeof tutorCourses[0]['tutor']>();
    for (const tc of tutorCourses) {
      if (!tutorMap.has(tc.tutor.id)) {
        tutorMap.set(tc.tutor.id, tc.tutor);
      }
    }

    const tutorUserIds = [...tutorMap.values()].map((t) => t.userId);
    const tutorUsers = await prisma.user.findMany({
      where: { id: { in: tutorUserIds } },
      select: { id: true, timezone: true },
    });
    const userTzMap = new Map(tutorUsers.map((u) => [u.id, u.timezone]));

    type ScoredTutor = { tutorId: string; matchingSlots: number; experience: number; activeEnrollments: number };
    const scored: ScoredTutor[] = [];

    for (const [tutorId, tutor] of tutorMap) {
      const tutorTz = userTzMap.get(tutor.userId) || 'Asia/Kolkata';

      let matchingSlots = 0;
      for (const slot of schedule) {
        const endTime = addMinutesToTime(slot.startTime, duration);
        // Convert parent's slot from parent TZ → tutor TZ
        const startConverted = convertTime(slot.startTime, parentTimezone, tutorTz);
        const endConverted = convertTime(endTime, parentTimezone, tutorTz);
        const tutorDay = shiftDay(slot.dayOfWeek, startConverted.dayShift);

        const dayTemplates = tutor.availabilityTemplates.filter((t) => t.dayOfWeek === tutorDay);
        const fits = dayTemplates.some((t) => t.startTime <= startConverted.time && t.endTime >= endConverted.time);
        if (fits) matchingSlots++;
      }

      if (matchingSlots >= schedule.length) {
        scored.push({
          tutorId,
          matchingSlots,
          experience: tutor.experience || 0,
          activeEnrollments: tutor._count.enrollments,
        });
      }
    }

    if (scored.length === 0) {
      throw ApiError.notFound(
        'No tutor matches your schedule preferences. Try different days or times.'
      );
    }

    scored.sort((a, b) => {
      if (b.matchingSlots !== a.matchingSlots) return b.matchingSlots - a.matchingSlots;
      if (b.experience !== a.experience) return b.experience - a.experience;
      return a.activeEnrollments - b.activeEnrollments;
    });

    return scored[0].tutorId;
  }

  // ==========================================
  // SESSION GENERATION
  // ==========================================

  async generateSessions(enrollmentId: string): Promise<number> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { include: { grade: { include: { tier: true } } } },
        parent: { include: { user: { select: { timezone: true } } } },
      },
    });
    if (!enrollment || enrollment.status !== 'ACTIVE') return 0;

    const schedule = this.parseSchedule(enrollment.schedule);
    if (schedule.length === 0) return 0;

    // Build a map: dayOfWeek → startTime for quick lookup
    const dayTimeMap = new Map<number, string>();
    for (const slot of schedule) {
      dayTimeMap.set(slot.dayOfWeek, slot.startTime);
    }

    // Use enrollment's immutable timezone snapshot
    const parentTz = enrollment.timezone || enrollment.parent?.user?.timezone || 'Asia/Dubai';
    const parentOffsetMs = getUtcOffsetMinutes(parentTz) * 60 * 1000;
    const nowInParentTz = new Date(Date.now() + parentOffsetMs);
    const today = new Date(Date.UTC(nowInParentTz.getUTCFullYear(), nowInParentTz.getUTCMonth(), nowInParentTz.getUTCDate()));
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + 7);

    const startFrom = enrollment.lastGeneratedDate
      ? new Date(new Date(enrollment.lastGeneratedDate).getTime() + 86400000)
      : today;

    if (startFrom > windowEnd) return 0;

    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        tutorId: enrollment.tutorId,
        date: { gte: startFrom, lte: windowEnd },
      },
      select: { date: true },
    });
    const blockedSet = new Set(blockedDates.map((b) => formatDateUTC(b.date)));

    // Only skip dates that already have an active (non-cancelled) session
    const existingSessions = await prisma.enrollmentSession.findMany({
      where: {
        enrollmentId,
        scheduledDate: { gte: startFrom, lte: windowEnd },
        status: { notIn: ['CANCELLED_PARENT', 'CANCELLED_LATE'] },
      },
      select: { scheduledDate: true },
    });
    const existingDates = new Set(existingSessions.map((s) => formatDateUTC(s.scheduledDate)));

    let balance = await computeBalance(enrollment.parentId);

    let sessionsCreated = 0;
    let lastDate = enrollment.lastGeneratedDate;
    const currentDate = new Date(startFrom);

    while (currentDate <= windowEnd) {
      // Re-check enrollment status to handle race conditions (e.g., parent cancelled mid-generation)
      const freshEnrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: { status: true },
      });
      if (!freshEnrollment || freshEnrollment.status !== 'ACTIVE') break;

      const dayOfWeek = currentDate.getDay();
      const dateStr = formatDateUTC(currentDate);
      const slotTime = dayTimeMap.get(dayOfWeek);

      if (slotTime && !existingDates.has(dateStr)) {
        const endTime = addMinutesToTime(slotTime, enrollment.duration);

        // Skip if today's slot time has already passed (prevent creating past sessions)
        if (dateStr === formatDateUTC(today)) {
          const [slotH, slotM] = slotTime.split(':').map(Number);
          const slotMinutesInDay = slotH * 60 + slotM;
          const nowMinutesInDay = nowInParentTz.getUTCHours() * 60 + nowInParentTz.getUTCMinutes();
          if (nowMinutesInDay >= slotMinutesInDay) {
            // Slot time already passed today — skip
            lastDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }
        }

        if (blockedSet.has(dateStr)) {
          try {
            await prisma.enrollmentSession.create({
              data: {
                enrollmentId,
                status: 'SKIPPED',
                scheduledDate: new Date(dateStr + 'T12:00:00Z'),
                scheduledStart: slotTime,
                scheduledEnd: endTime,
                creditsCharged: 0,
              },
            });
            sessionsCreated++;
          } catch (err: any) {
            if (err.code === 'P2002') continue; // Unique constraint — already exists, skip
            throw err;
          }
        } else if (balance >= enrollment.creditsPerSession) {
          // Pre-check: skip if session already exists for this date+time (avoids transaction overhead)
          const existingSession = await prisma.enrollmentSession.findFirst({
            where: { enrollmentId, scheduledDate: new Date(dateStr + 'T12:00:00Z'), scheduledStart: slotTime },
          });
          if (existingSession) {
            lastDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          try {
            await prisma.$transaction(async (tx) => {
              const session = await tx.enrollmentSession.create({
                data: {
                  enrollmentId,
                  status: 'CONFIRMED',
                  scheduledDate: new Date(dateStr + 'T12:00:00Z'),
                  scheduledStart: slotTime,
                  scheduledEnd: endTime,
                  creditsCharged: enrollment.creditsPerSession,
                  creditDeductedAt: new Date(),
                },
              });

              await tx.creditTransaction.create({
                data: {
                  parentId: enrollment.parentId,
                  type: 'DEDUCTION',
                  amount: enrollment.creditsPerSession,
                  description: `Class session — ${dateStr}`,
                  enrollmentSessionId: session.id,
                },
              });
            });

            balance -= enrollment.creditsPerSession;
            sessionsCreated++;
          } catch (err: any) {
            if (err.code === 'P2002') continue; // Unique constraint — already exists, skip
            throw err;
          }
        } else {
          await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: 'PAUSED', pauseReason: 'Insufficient credits' },
          });
          break;
        }
      }

      lastDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (lastDate) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { lastGeneratedDate: lastDate },
      });
    }

    return sessionsCreated;
  }

  // ==========================================
  // PARENT: CREATE
  // ==========================================

  async create(userId: string, data: CreateEnrollmentDTO) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
    const parentTz = user?.timezone || 'Asia/Dubai';

    // Validate timezone is a real IANA timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: parentTz });
    } catch {
      throw ApiError.badRequest('INVALID_TIMEZONE', `Invalid timezone: ${parentTz}. Please update your timezone in settings.`);
    }

    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const student = await prisma.student.findFirst({
      where: { id: data.studentId, parentId: parent.id, deletedAt: null },
      include: { grade: { include: { tier: true } } },
    });
    if (!student) throw ApiError.notFound('Student not found or does not belong to you');
    if (!student.grade?.tier) throw ApiError.badRequest('MISSING_GRADE_TIER', 'Student grade tier not configured. Contact admin.');

    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject || !subject.isActive) throw ApiError.notFound('Subject not found or inactive');

    const creditsPerSession = this.getCreditsForDuration(student.grade.tier, data.duration);
    const minCredits = creditsPerSession * Math.min(data.schedule.length, 4); // At least 1 week's worth
    const balance = await computeBalance(parent.id);
    if (balance < minCredits) {
      throw ApiError.badRequest('INSUFFICIENT_CREDITS', `You need at least ${minCredits} credits (${creditsPerSession}/session × ${Math.min(data.schedule.length, 4)} sessions) to start. Current balance: ${balance}`);
    }

    const existing = await prisma.enrollment.findFirst({
      where: { studentId: data.studentId, subjectId: data.subjectId, status: { in: ['ACTIVE', 'PAUSED'] } },
    });
    if (existing) {
      throw ApiError.conflict('DUPLICATE_ENROLLMENT', 'An active enrollment already exists for this student and subject');
    }

    const tutorId = await this.findMatchingTutor(
      data.subjectId,
      student.gradeId,
      data.schedule,
      data.duration,
      parentTz
    );

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: data.studentId,
        parentId: parent.id,
        subjectId: data.subjectId,
        tutorId,
        schedule: data.schedule as unknown as Prisma.InputJsonValue,
        duration: data.duration,
        creditsPerSession,
        timezone: parentTz,
        zoomLink: data.zoomLink,
        zoomPassword: data.zoomPassword,
      },
      include: enrollmentInclude,
    });

    const sessionsGenerated = await this.generateSessions(enrollment.id);

    // Auto-generate Zoom meeting link (non-blocking)
    try {
      const { ZoomService } = await import('../zoom/zoom.service');
      const zoom = new ZoomService();
      const meeting = await zoom.createRecurringMeeting(
        `${subject.name} - ${student.firstName} ${student.lastName}`,
        data.duration,
        parentTz
      );
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          zoomLink: meeting.joinUrl,
          zoomPassword: meeting.password,
          zoomMeetingId: meeting.meetingId,
        },
      });
      // Merge into response
      (enrollment as any).zoomLink = meeting.joinUrl;
      (enrollment as any).zoomPassword = meeting.password;
      (enrollment as any).zoomMeetingId = meeting.meetingId;
    } catch (err) {
      console.error('Zoom meeting creation failed (non-blocking):', err);
      // Enrollment still works — tutor can add link manually
    }

    // Notify parent + tutor (non-blocking)
    try {
      const { NotificationService } = await import('../notification/notification.service');
      const { enrollmentCreatedParent, enrollmentCreatedTutor } = await import('../notification/templates/event-templates');
      const ns = new NotificationService();
      const parentTemplate = enrollmentCreatedParent(
        `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        enrollment.subject.name,
        `${enrollment.tutor.firstName} ${enrollment.tutor.lastName}`
      );
      const tutorTemplate = enrollmentCreatedTutor(
        `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        enrollment.subject.name,
        `${enrollment.parent.firstName} ${enrollment.parent.lastName}`
      );
      const parentUserId = enrollment.parent.userId;
      const parentEmail = enrollment.parent.user?.email || '';
      const tutorUserId = enrollment.tutor.userId;
      const tutorEmail = enrollment.tutor.user?.email || '';
      await ns.sendBulk([
        { userId: parentUserId, userEmail: parentEmail, type: 'ENROLLMENT_CREATED', ...parentTemplate, emailHtml: parentTemplate.html },
        { userId: tutorUserId, userEmail: tutorEmail, type: 'ENROLLMENT_CREATED', ...tutorTemplate, emailHtml: tutorTemplate.html },
      ]);
    } catch (err) {
      console.error('Enrollment notification failed (non-blocking):', err);
    }

    return { ...enrollment, sessionsGenerated };
  }

  // ==========================================
  // PARENT: LIST
  // ==========================================

  async listForParent(userId: string, query: EnrollmentQueryDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: any = { parentId: parent.id };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          ...enrollmentInclude,
          sessions: {
            where: { status: { in: ['CONFIRMED', 'SCHEDULED'] }, scheduledDate: { gte: new Date() } },
            orderBy: { scheduledDate: 'asc' },
            take: 3,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // PARENT: GET BY ID
  // ==========================================

  async getById(enrollmentId: string, userId: string, role: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        ...enrollmentInclude,
        sessions: {
          orderBy: { scheduledDate: 'desc' },
          take: 50,
          include: sessionInclude,
        },
      },
    });

    if (!enrollment) throw ApiError.notFound('Enrollment not found');

    if (role === 'PARENT') {
      const parent = await prisma.parentProfile.findUnique({ where: { userId } });
      if (!parent || enrollment.parentId !== parent.id) throw ApiError.forbidden('Not your enrollment');
    } else if (role === 'TUTOR') {
      const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
      if (!tutor || enrollment.tutorId !== tutor.id) throw ApiError.forbidden('Not your enrollment');
    }

    return enrollment;
  }

  // ==========================================
  // PARENT: PAUSE / RESUME / CANCEL
  // ==========================================

  private static PAUSE_COOLDOWN_HOURS = 48;
  private static MAX_PAUSES_PER_MONTH = 3;

  /** Reset monthly pause count if we're in a new calendar month */
  private getEffectivePauseCount(enrollment: { pauseCountMonth: number; pauseCountResetAt: Date | null }): number {
    if (!enrollment.pauseCountResetAt) return 0;
    const now = new Date();
    const resetDate = new Date(enrollment.pauseCountResetAt);
    if (now.getFullYear() !== resetDate.getFullYear() || now.getMonth() !== resetDate.getMonth()) {
      return 0; // New month — reset
    }
    return enrollment.pauseCountMonth;
  }

  async pause(enrollmentId: string, userId: string) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.parentId !== parent.id) throw ApiError.notFound('Enrollment not found');
    if (enrollment.status !== 'ACTIVE') throw ApiError.badRequest('INVALID_STATUS', 'Only active enrollments can be paused');

    // 48hr cooldown after last resume
    if (enrollment.lastResumedAt) {
      const hoursSinceResume = (Date.now() - new Date(enrollment.lastResumedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceResume < EnrollmentService.PAUSE_COOLDOWN_HOURS) {
        const hoursLeft = Math.ceil(EnrollmentService.PAUSE_COOLDOWN_HOURS - hoursSinceResume);
        throw ApiError.badRequest('COOLDOWN', `You can pause again in ${hoursLeft} hour(s). A 48-hour cooldown applies after resuming.`);
      }
    }

    // Max pauses per calendar month
    const effectiveCount = this.getEffectivePauseCount(enrollment);
    if (effectiveCount >= EnrollmentService.MAX_PAUSES_PER_MONTH) {
      throw ApiError.badRequest('PAUSE_LIMIT', `You've used all ${EnrollmentService.MAX_PAUSES_PER_MONTH} pauses for this month. You can pause again next month.`);
    }

    await this.refundFutureSessions(enrollmentId, false, 'Refund (paused by parent)');

    const newCount = effectiveCount + 1;
    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'PAUSED',
        pauseReason: 'Paused by parent',
        lastPausedAt: new Date(),
        pauseCountMonth: newCount,
        pauseCountResetAt: new Date(),
      },
      include: enrollmentInclude,
    });
  }

  async resume(enrollmentId: string, userId: string) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.parentId !== parent.id) throw ApiError.notFound('Enrollment not found');
    if (enrollment.status !== 'PAUSED') throw ApiError.badRequest('INVALID_STATUS', 'Only paused enrollments can be resumed');

    // 48hr cooldown after last pause
    if (enrollment.lastPausedAt) {
      const hoursSincePause = (Date.now() - new Date(enrollment.lastPausedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSincePause < EnrollmentService.PAUSE_COOLDOWN_HOURS) {
        const hoursLeft = Math.ceil(EnrollmentService.PAUSE_COOLDOWN_HOURS - hoursSincePause);
        throw ApiError.badRequest('COOLDOWN', `You can resume in ${hoursLeft} hour(s). A 48-hour cooldown applies after pausing.`);
      }
    }

    const balance = await computeBalance(parent.id);
    if (balance < enrollment.creditsPerSession) {
      throw ApiError.badRequest('INSUFFICIENT_CREDITS', `Need at least ${enrollment.creditsPerSession} credits to resume. Current balance: ${balance}`);
    }

    // Don't delete manually cancelled sessions — respect parent's cancellations
    // Only reset lastGeneratedDate so cron regenerates future slots

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'ACTIVE',
        pauseReason: null,
        lastGeneratedDate: null, // Triggers regeneration from today
        lastResumedAt: new Date(),
      },
      include: enrollmentInclude,
    });

    await this.generateSessions(enrollmentId);

    return updated;
  }

  async cancel(enrollmentId: string, userId: string, reason?: string) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.parentId !== parent.id) throw ApiError.notFound('Enrollment not found');
    if (enrollment.status === 'CANCELLED') {
      throw ApiError.badRequest('INVALID_STATUS', 'Enrollment is already cancelled');
    }

    await this.refundFutureSessions(enrollmentId, true, 'Refund (cancelled by parent)');
    await this.deleteZoomMeeting(enrollment);

    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'CANCELLED', cancelReason: reason || 'Cancelled by parent', zoomLink: null, zoomPassword: null, zoomMeetingId: null },
      include: enrollmentInclude,
    });
  }

  // ==========================================
  // PARENT: CANCEL SESSION (24hr policy)
  // ==========================================

  async cancelSession(sessionId: string, userId: string, data: CancelSessionDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const session = await prisma.enrollmentSession.findUnique({
      where: { id: sessionId },
      include: { enrollment: true },
    });
    if (!session) throw ApiError.notFound('Session not found');
    if (session.enrollment.parentId !== parent.id) throw ApiError.forbidden('Not your session');
    if (!['CONFIRMED', 'SCHEDULED'].includes(session.status)) {
      throw ApiError.badRequest('INVALID_STATUS', 'This session cannot be cancelled');
    }

    // Session times are in parent's local timezone — convert to UTC for accurate 24hr comparison
    const parentUser = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
    const parentTz = parentUser?.timezone || 'Asia/Dubai';
    const dateStr = formatDateUTC(session.scheduledDate);
    const { time: utcStartTime, dayShift } = localToUtc(session.scheduledStart, parentTz, session.scheduledDate);
    const sessionDateTimeUtc = new Date(dateStr + 'T' + utcStartTime + ':00Z');
    if (dayShift !== 0) {
      sessionDateTimeUtc.setDate(sessionDateTimeUtc.getDate() + dayShift);
    }

    const hoursUntilSession = (sessionDateTimeUtc.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilSession >= 24) {
      await prisma.$transaction(async (tx) => {
        await tx.enrollmentSession.update({
          where: { id: sessionId },
          data: { status: 'CANCELLED_PARENT', cancelledAt: new Date(), cancelReason: data.reason || 'Cancelled by parent (24hr+ notice)' },
        });

        if (session.creditsCharged > 0 && session.creditDeductedAt) {
          await tx.creditTransaction.create({
            data: {
              parentId: session.enrollment.parentId,
              type: 'ADMIN_ADJUSTMENT',
              amount: session.creditsCharged,
              description: `Refund: cancelled session ${formatDateUTC(session.scheduledDate)}`,
            },
          });
        }
      });
    } else {
      await prisma.enrollmentSession.update({
        where: { id: sessionId },
        data: { status: 'CANCELLED_LATE', cancelledAt: new Date(), cancelReason: data.reason || 'Late cancellation (less than 24hr notice)' },
      });
    }

    // Return the updated session so frontend can update its state
    return prisma.enrollmentSession.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });
  }

  // ==========================================
  // PARENT: REPORT TUTOR NO-SHOW
  // ==========================================

  async reportNoShow(sessionId: string, userId: string) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const session = await prisma.enrollmentSession.findUnique({
      where: { id: sessionId },
      include: { enrollment: { include: { tutor: true } } },
    });
    if (!session) throw ApiError.notFound('Session not found');
    if (session.enrollment.parentId !== parent.id) throw ApiError.forbidden('Not your session');

    // Only COMPLETED or CONFIRMED sessions can be reported as no-show (not already reported)
    if (!['COMPLETED', 'CONFIRMED'].includes(session.status)) {
      if (session.status === 'NO_SHOW_REPORTED') {
        throw ApiError.badRequest('ALREADY_REPORTED', 'This session has already been reported as a no-show');
      }
      throw ApiError.badRequest('INVALID_STATUS', 'This session cannot be reported as a no-show');
    }

    // Must report within 24hrs of the session end time
    const parentUser = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
    const parentTz = parentUser?.timezone || 'Asia/Dubai';
    const dateStr = formatDateUTC(session.scheduledDate);
    const { time: utcEndTime, dayShift } = localToUtc(session.scheduledEnd, parentTz, session.scheduledDate);
    const sessionEndUtc = new Date(dateStr + 'T' + utcEndTime + ':00Z');
    if (dayShift !== 0) sessionEndUtc.setDate(sessionEndUtc.getDate() + dayShift);

    const hoursSinceEnd = (Date.now() - sessionEndUtc.getTime()) / (1000 * 60 * 60);
    if (hoursSinceEnd < 0) {
      throw ApiError.badRequest('TOO_EARLY', 'You can only report a no-show after the session time has passed');
    }
    if (hoursSinceEnd > 24) {
      throw ApiError.badRequest('TOO_LATE', 'No-show reports must be submitted within 24 hours of the session');
    }

    // Flag session as NO_SHOW_REPORTED (pending admin review — no instant refund or strike)
    await prisma.enrollmentSession.update({
      where: { id: sessionId },
      data: { status: 'NO_SHOW_REPORTED', cancelReason: 'Tutor no-show reported by parent' },
    });

    return prisma.enrollmentSession.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });
  }

  // ==========================================
  // PARENT: LIST SESSIONS
  // ==========================================

  async listSessions(enrollmentId: string, userId: string, query: SessionQueryDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.parentId !== parent.id) throw ApiError.notFound('Enrollment not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: any = { enrollmentId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.enrollmentSession.findMany({
        where,
        include: sessionInclude,
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enrollmentSession.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // TUTOR: LIST
  // ==========================================

  async listForTutor(userId: string, query: EnrollmentQueryDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: any = { tutorId: tutor.id };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          ...enrollmentInclude,
          sessions: {
            where: { status: { in: ['CONFIRMED', 'SCHEDULED'] }, scheduledDate: { gte: new Date() } },
            orderBy: { scheduledDate: 'asc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // TUTOR: UPDATE MEETING LINK
  // ==========================================

  async updateMeetingLink(enrollmentId: string, userId: string, zoomLink: string, zoomPassword?: string) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.tutorId !== tutor.id) throw ApiError.notFound('Enrollment not found');

    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { zoomLink, zoomPassword: zoomPassword || null },
      include: enrollmentInclude,
    });
  }

  // ==========================================
  // TUTOR: LIST SESSIONS
  // ==========================================

  async listSessionsForTutor(enrollmentId: string, userId: string, query: SessionQueryDTO) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutor) throw ApiError.notFound('Tutor profile not found');

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.tutorId !== tutor.id) throw ApiError.notFound('Enrollment not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: any = { enrollmentId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.enrollmentSession.findMany({
        where,
        include: sessionInclude,
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enrollmentSession.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // ADMIN: LIST ALL
  // ==========================================

  async listAll(query: EnrollmentQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: any = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: enrollmentInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // ADMIN: LIST SESSIONS
  // ==========================================

  async adminListSessions(enrollmentId: string, query: SessionQueryDTO) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw ApiError.notFound('Enrollment not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const where: any = { enrollmentId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.enrollmentSession.findMany({
        where,
        include: sessionInclude,
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enrollmentSession.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // ADMIN: REASSIGN TUTOR
  // ==========================================

  async reassignTutor(enrollmentId: string, tutorId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true, subject: true, parent: { include: { user: { select: { timezone: true } } } } },
    });
    if (!enrollment) throw ApiError.notFound('Enrollment not found');

    const tutor = await prisma.tutorProfile.findUnique({ where: { id: tutorId } });
    if (!tutor || !tutor.isActive) throw ApiError.notFound('Tutor not found or inactive');

    // Delete old Zoom meeting
    await this.deleteZoomMeeting(enrollment);

    // Create new Zoom meeting for new tutor (non-blocking)
    let zoomLink: string | null = null;
    let zoomPassword: string | null = null;
    let zoomMeetingId: bigint | null = null;
    try {
      const { ZoomService } = await import('../zoom/zoom.service');
      const zoom = new ZoomService();
      const parentTz = enrollment.parent?.user?.timezone || 'Asia/Dubai';
      const meeting = await zoom.createRecurringMeeting(
        `${enrollment.subject.name} - ${enrollment.student.firstName} ${enrollment.student.lastName}`,
        enrollment.duration,
        parentTz
      );
      zoomLink = meeting.joinUrl;
      zoomPassword = meeting.password;
      zoomMeetingId = meeting.meetingId;
    } catch (err) {
      console.error('Zoom meeting creation failed on reassign (non-blocking):', err);
    }

    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { tutorId, zoomLink, zoomPassword, zoomMeetingId },
      include: enrollmentInclude,
    });
  }

  // ==========================================
  // ADMIN: LIST TUTORS (for reassignment)
  // ==========================================

  async listTutorsForReassign(enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { subjectId: true, studentId: true },
    });
    if (!enrollment) throw ApiError.notFound('Enrollment not found');

    const student = await prisma.student.findUnique({ where: { id: enrollment.studentId }, select: { gradeId: true } });

    const tutorCourses = await prisma.tutorCourse.findMany({
      where: {
        course: { subjectId: enrollment.subjectId, gradeId: student?.gradeId, isActive: true },
        tutor: { isActive: true, deletedAt: null },
      },
      include: { tutor: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Deduplicate
    const tutorMap = new Map<string, { id: string; firstName: string; lastName: string }>();
    for (const tc of tutorCourses) {
      if (!tutorMap.has(tc.tutor.id)) tutorMap.set(tc.tutor.id, tc.tutor);
    }

    return [...tutorMap.values()];
  }

  // ==========================================
  // ADMIN: FORCE CANCEL
  // ==========================================

  async adminCancel(enrollmentId: string, reason?: string) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw ApiError.notFound('Enrollment not found');
    if (enrollment.status === 'CANCELLED') {
      throw ApiError.badRequest('INVALID_STATUS', 'Enrollment is already cancelled');
    }

    await this.refundFutureSessions(enrollmentId, true, 'Refund (cancelled by admin)');
    await this.deleteZoomMeeting(enrollment);

    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'CANCELLED', cancelReason: reason || 'Cancelled by admin', zoomLink: null, zoomPassword: null, zoomMeetingId: null },
      include: enrollmentInclude,
    });
  }

  // ==========================================
  // ADMIN: FORCE PAUSE
  // ==========================================

  async adminPause(enrollmentId: string, reason?: string) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw ApiError.notFound('Enrollment not found');
    if (enrollment.status !== 'ACTIVE') {
      throw ApiError.badRequest('INVALID_STATUS', 'Only active enrollments can be paused');
    }

    await this.refundFutureSessions(enrollmentId, false, 'Refund (paused by admin)');

    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'PAUSED', pauseReason: reason || 'Paused by admin', lastPausedAt: new Date() },
      include: enrollmentInclude,
    });
  }

  // ==========================================
  // ADMIN: FORCE RESUME
  // ==========================================

  async adminResume(enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw ApiError.notFound('Enrollment not found');
    if (enrollment.status !== 'PAUSED') {
      throw ApiError.badRequest('INVALID_STATUS', 'Only paused enrollments can be resumed');
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'ACTIVE', pauseReason: null, lastResumedAt: new Date(), lastGeneratedDate: null },
      include: enrollmentInclude,
    });

    await this.generateSessions(enrollmentId);
    return updated;
  }

  // ==========================================
  // ADMIN: REVIEW NO-SHOW REPORT
  // ==========================================

  async reviewNoShow(sessionId: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
    const session = await prisma.enrollmentSession.findUnique({
      where: { id: sessionId },
      include: { enrollment: { include: { tutor: true } } },
    });
    if (!session) throw ApiError.notFound('Session not found');

    if (session.status !== 'NO_SHOW_REPORTED') {
      throw ApiError.badRequest('INVALID_STATUS', 'This session is not pending no-show review');
    }

    if (decision === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        // Mark session as MISSED_TUTOR (admin-confirmed)
        await tx.enrollmentSession.update({
          where: { id: sessionId },
          data: {
            status: 'MISSED_TUTOR',
            cancelReason: notes || session.cancelReason || 'Tutor no-show confirmed by admin',
          },
        });

        // Refund credits
        if (session.creditsCharged > 0) {
          await tx.creditTransaction.create({
            data: {
              parentId: session.enrollment.parentId,
              type: 'ADMIN_ADJUSTMENT',
              amount: session.creditsCharged,
              description: `Refund: tutor no-show on ${formatDateUTC(session.scheduledDate)}`,
            },
          });
        }

        // Add strike to tutor (reset if last strike was > 30 days ago)
        const tutorId = session.enrollment.tutorId;
        const tutor = await tx.tutorProfile.findUnique({
          where: { id: tutorId },
          select: { noShowStrikes: true, lastStrikeAt: true },
        });
        let newStrikes = 1;
        if (tutor?.lastStrikeAt) {
          const daysSinceLastStrike = (Date.now() - new Date(tutor.lastStrikeAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastStrike <= 30) {
            newStrikes = (tutor.noShowStrikes || 0) + 1;
          }
        }

        await tx.tutorProfile.update({
          where: { id: tutorId },
          data: { noShowStrikes: newStrikes, lastStrikeAt: new Date() },
        });
      });
    } else {
      // REJECT — revert to COMPLETED, no refund, no strike
      await prisma.enrollmentSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', cancelReason: null },
      });
    }

    return prisma.enrollmentSession.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });
  }

  // ==========================================
  // HELPER: REFUND FUTURE SESSIONS
  // ==========================================

  private async refundFutureSessions(enrollmentId: string, refundAll = false, reason = 'Refund') {
    const now = new Date();
    // When refunding all (cancel), use start of today to catch all sessions including today's
    // scheduledDate is stored at T12:00:00Z, so use T00:00:00Z to include today
    const cutoff = refundAll
      ? new Date(now.toISOString().split('T')[0] + 'T00:00:00Z')
      : new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const futureSessions = await prisma.enrollmentSession.findMany({
      where: {
        enrollmentId,
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
        scheduledDate: { gte: cutoff },
      },
      include: { enrollment: { select: { parentId: true } } },
    });

    for (const session of futureSessions) {
      if (session.creditsCharged > 0) {
        await prisma.creditTransaction.create({
          data: {
            parentId: session.enrollment.parentId,
            type: 'ADMIN_ADJUSTMENT',
            amount: session.creditsCharged,
            description: `${reason}: session ${formatDateUTC(session.scheduledDate)}`,
          },
        });
      }
    }

    // Delete refunded sessions to prevent DB clutter on pause/resume cycles
    if (futureSessions.length > 0) {
      await prisma.enrollmentSession.deleteMany({
        where: { id: { in: futureSessions.map((s) => s.id) } },
      });
    }
  }

  // ==========================================
  // CRON: GENERATE ALL ACTIVE SESSIONS
  // ==========================================

  async generateAllActiveSessions(): Promise<number> {
    const activeEnrollments = await prisma.enrollment.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    let totalGenerated = 0;
    for (const enrollment of activeEnrollments) {
      try {
        const count = await this.generateSessions(enrollment.id);
        totalGenerated += count;
      } catch (error) {
        console.error(`Failed to generate sessions for enrollment ${enrollment.id}:`, error);
      }
    }

    return totalGenerated;
  }

  // ==========================================
  // CRON: COMPLETE PAST SESSIONS
  // ==========================================

  async completePassedSessions(): Promise<number> {
    const now = new Date();

    // Find all CONFIRMED sessions where the scheduled date has passed (broad filter, fine-tune below)
    const confirmedSessions = await prisma.enrollmentSession.findMany({
      where: {
        status: 'CONFIRMED',
        scheduledDate: { lte: now },
      },
      select: { id: true, scheduledDate: true, scheduledEnd: true, enrollment: { select: { timezone: true, parent: { include: { user: { select: { timezone: true } } } } } } },
    });

    let completed = 0;
    for (const session of confirmedSessions) {
      // Use enrollment's immutable timezone snapshot
      const parentTz = session.enrollment.timezone || session.enrollment.parent?.user?.timezone || 'Asia/Dubai';
      const dateStr = formatDateUTC(session.scheduledDate);
      const { time: utcEndTime, dayShift } = localToUtc(session.scheduledEnd, parentTz, session.scheduledDate);

      // Build the actual UTC datetime of the session end
      const sessionEndUtc = new Date(dateStr + 'T' + utcEndTime + ':00Z');
      if (dayShift !== 0) {
        sessionEndUtc.setDate(sessionEndUtc.getDate() + dayShift);
      }

      if (sessionEndUtc <= now) {
        await prisma.enrollmentSession.update({
          where: { id: session.id },
          data: { status: 'COMPLETED' },
        });

        // M16: Auto-create tutor earning for completed session
        try {
          await this.earningService.createEarningForSession(session.id);
        } catch (err) {
          console.error(`[CRON] Failed to create earning for session ${session.id}:`, err);
        }

        completed++;
      }
    }

    return completed;
  }

  // ==========================================
  // HOOK: CHECK & RESUME PAUSED ENROLLMENTS
  // ==========================================

  async checkAndResumePausedEnrollments(parentId: string): Promise<number> {
    const pausedEnrollments = await prisma.enrollment.findMany({
      where: { parentId, status: 'PAUSED', pauseReason: 'Insufficient credits' },
    });

    if (pausedEnrollments.length === 0) return 0;

    const balance = await computeBalance(parentId);
    let resumed = 0;

    for (const enrollment of pausedEnrollments) {
      if (balance >= enrollment.creditsPerSession) {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: 'ACTIVE', pauseReason: null, lastGeneratedDate: null },
        });
        await this.generateSessions(enrollment.id);
        resumed++;
      }
    }

    return resumed;
  }

  // ==========================================
  // PARENT: COURSE MATERIALS
  // ==========================================

  async getCourseMaterials(userId: string, enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        parent: { select: { userId: true } },
        student: { select: { gradeId: true } },
        subject: { select: { id: true, name: true } },
      },
    });

    if (!enrollment) throw ApiError.notFound('Enrollment not found');
    if (enrollment.parent.userId !== userId) throw ApiError.forbidden('Not your enrollment');

    const course = await prisma.course.findUnique({
      where: { subjectId_gradeId: { subjectId: enrollment.subjectId, gradeId: enrollment.student.gradeId } },
      select: {
        id: true,
        name: true,
        materials: {
          select: { id: true, title: true, fileUrl: true, fileType: true, fileSizeKb: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return {
      courseName: course?.name || `${enrollment.subject.name}`,
      materials: course?.materials || [],
    };
  }
}
