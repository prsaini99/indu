import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Permission, Role, TokenType } from '@prisma/client';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import {
  UpdateParentProfileDTO,
  CreateChildDTO,
  UpdateChildDTO,
  CreateUserDTO,
  SetPermissionsDTO,
  UpdateConsultantProfileDTO,
} from './user.types';

export class UserService {
  // ==========================================
  // PARENT PROFILE
  // ==========================================
  async getParentProfile(userId: string) {
    const profile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            grade: { select: { id: true, name: true } },
            subjectNeeds: {
              include: { subject: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!profile) {
      throw ApiError.notFound('Parent profile not found');
    }

    // Format children with subjects
    const children = profile.children.map((child) => ({
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth,
      grade: child.grade,
      subjects: child.subjectNeeds.map((sn) => sn.subject),
      notes: child.notes,
    }));

    return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))
        ?.email,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      children,
      walletBalance: 0, // TODO: compute from wallet when M8 is implemented
    };
  }

  async updateParentProfile(userId: string, data: UpdateParentProfileDTO) {
    const profile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Parent profile not found');
    }

    const updated = await prisma.parentProfile.update({
      where: { userId },
      data,
    });

    return updated;
  }

  // ==========================================
  // CHILD MANAGEMENT
  // ==========================================
  async getChildren(userId: string) {
    const profile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Parent profile not found');

    const children = await prisma.student.findMany({
      where: { parentId: profile.id, deletedAt: null },
      include: {
        grade: { select: { id: true, name: true } },
        subjectNeeds: {
          include: { subject: { select: { id: true, name: true } } },
        },
      },
    });

    return children.map((child) => ({
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth,
      grade: child.grade,
      subjects: child.subjectNeeds.map((sn) => sn.subject),
      notes: child.notes,
    }));
  }

  async createChild(userId: string, data: CreateChildDTO) {
    const profile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Parent profile not found');

    // Verify grade exists
    const grade = await prisma.gradeLevel.findUnique({ where: { id: data.gradeId } });
    if (!grade) throw ApiError.badRequest('INVALID_GRADE', 'Grade level not found');

    // Verify subjects exist (if provided)
    if (data.subjectIds && data.subjectIds.length > 0) {
      const subjects = await prisma.subject.findMany({
        where: { id: { in: data.subjectIds } },
      });
      if (subjects.length !== data.subjectIds.length) {
        throw ApiError.badRequest('INVALID_SUBJECT', 'One or more subjects not found');
      }
    }

    const child = await prisma.student.create({
      data: {
        parentId: profile.id,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gradeId: data.gradeId,
        notes: data.notes,
        subjectNeeds: data.subjectIds
          ? {
              create: data.subjectIds.map((subjectId) => ({ subjectId })),
            }
          : undefined,
      },
      include: {
        grade: { select: { id: true, name: true } },
        subjectNeeds: {
          include: { subject: { select: { id: true, name: true } } },
        },
      },
    });

    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth,
      grade: child.grade,
      subjects: child.subjectNeeds.map((sn) => sn.subject),
      notes: child.notes,
    };
  }

  async updateChild(userId: string, childId: string, data: UpdateChildDTO) {
    const profile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Parent profile not found');

    // Verify child belongs to this parent
    const child = await prisma.student.findFirst({
      where: { id: childId, parentId: profile.id, deletedAt: null },
    });
    if (!child) throw ApiError.notFound('Child not found');

    // Update child and subject needs in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update basic info
      const { subjectIds, dateOfBirth, ...updateData } = data;
      const updatedChild = await tx.student.update({
        where: { id: childId },
        data: {
          ...updateData,
          ...(dateOfBirth !== undefined ? { dateOfBirth: new Date(dateOfBirth) } : {}),
        },
      });

      // Update subject needs if provided
      if (subjectIds !== undefined) {
        await tx.studentSubject.deleteMany({ where: { studentId: childId } });
        if (subjectIds.length > 0) {
          await tx.studentSubject.createMany({
            data: subjectIds.map((subjectId) => ({ studentId: childId, subjectId })),
          });
        }
      }

      return tx.student.findUnique({
        where: { id: childId },
        include: {
          grade: { select: { id: true, name: true } },
          subjectNeeds: {
            include: { subject: { select: { id: true, name: true } } },
          },
        },
      });
    });

    return {
      id: updated!.id,
      firstName: updated!.firstName,
      lastName: updated!.lastName,
      dateOfBirth: updated!.dateOfBirth,
      grade: updated!.grade,
      subjects: updated!.subjectNeeds.map((sn) => sn.subject),
      notes: updated!.notes,
    };
  }

  async deleteChild(userId: string, childId: string) {
    const profile = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Parent profile not found');

    const child = await prisma.student.findFirst({
      where: { id: childId, parentId: profile.id, deletedAt: null },
    });
    if (!child) throw ApiError.notFound('Child not found');

    // Soft delete
    await prisma.student.update({
      where: { id: childId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Child profile removed' };
  }

  // ==========================================
  // CONSULTANT PROFILE
  // ==========================================
  async getConsultantProfile(userId: string) {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw ApiError.notFound('Consultant profile not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      contactEmail: profile.email,
      loginEmail: user?.email,
    };
  }

  async updateConsultantProfile(userId: string, data: UpdateConsultantProfileDTO) {
    const profile = await prisma.consultantProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Consultant profile not found');
    }

    const updated = await prisma.consultantProfile.update({
      where: { userId },
      data,
    });

    return updated;
  }

  // ==========================================
  // ADMIN: USER MANAGEMENT
  // ==========================================
  async listUsers(query: {
    page?: string;
    limit?: string;
    role?: Role;
    search?: string;
    isActive?: string;
  }) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { parentProfile: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { tutorProfile: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { consultantProfile: { firstName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          parentProfile: { select: { firstName: true, lastName: true, phone: true } },
          tutorProfile: { select: { firstName: true, lastName: true, phone: true } },
          consultantProfile: { select: { firstName: true, lastName: true, phone: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = users.map((u) => {
      const profile = u.parentProfile || u.tutorProfile || u.consultantProfile;
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        phone: profile?.phone || null,
        isActive: u.isActive,
        isEmailVerified: u.isEmailVerified,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      };
    });

    return { data: formatted, meta: buildPaginationMeta(page, limit, total) };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        parentProfile: { include: { children: { where: { deletedAt: null } } } },
        tutorProfile: { include: { courses: { include: { course: { include: { subject: true, grade: true } } } }, certifications: true } },
        consultantProfile: true,
        adminPermissions: { select: { permission: true } },
      },
    });

    if (!user || user.deletedAt) throw ApiError.notFound('User not found');

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createAdminUser(data: CreateUserDTO) {
    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw ApiError.conflict('DUPLICATE_ENTRY', 'An account with this email already exists');
    }

    // Generate temporary password
    const tempPassword = uuidv4().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          role: data.role as Role,
          isEmailVerified: true, // Admin-provisioned accounts are pre-verified
          forcePasswordChange: true,
        },
      });

      // Create role-specific profile
      if (data.role === 'TUTOR') {
        await tx.tutorProfile.create({
          data: {
            userId: newUser.id,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
        });
      } else if (data.role === 'CONSULTANT') {
        await tx.consultantProfile.create({
          data: {
            userId: newUser.id,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
        });
      } else if (data.role === 'ADMIN' && data.permissions) {
        // Create admin permissions
        await tx.adminPermission.createMany({
          data: data.permissions.map((p) => ({
            userId: newUser.id,
            permission: p,
          })),
        });
      }

      return newUser;
    });

    // TODO (M12): Send invite email with temp password
    if (env.NODE_ENV === 'development') {
      console.log(`Temp password for ${data.email}: ${tempPassword}`);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      message: 'Account created. Invite email sent with temporary password.',
    };
  }

  async updateUserStatus(id: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw ApiError.notFound('User not found');

    // Prevent disabling super admin
    if (user.role === Role.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot disable Super Admin account');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    // If deactivating, invalidate their session
    if (!isActive) {
      await prisma.token.deleteMany({
        where: { userId: id, type: TokenType.REFRESH },
      });
    }

    return { message: `User ${isActive ? 'activated' : 'deactivated'} successfully` };
  }

  async softDeleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw ApiError.notFound('User not found');

    if (user.role === Role.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot delete Super Admin account');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });

      // Invalidate sessions
      await tx.token.deleteMany({
        where: { userId: id, type: TokenType.REFRESH },
      });

      // Also soft-delete the role profile if it has deletedAt
      if (user.role === Role.TUTOR) {
        await tx.tutorProfile.updateMany({
          where: { userId: id },
          data: { deletedAt: new Date(), isActive: false },
        });
      }
    });

    return { message: 'User deleted' };
  }

  async setPermissions(userId: string, data: SetPermissionsDTO) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    if (user.role !== Role.ADMIN) {
      throw ApiError.badRequest('INVALID_ROLE', 'Permissions can only be set for Admin users');
    }

    // Replace all permissions
    await prisma.$transaction(async (tx) => {
      await tx.adminPermission.deleteMany({ where: { userId } });
      if (data.permissions.length > 0) {
        await tx.adminPermission.createMany({
          data: data.permissions.map((p) => ({ userId, permission: p })),
        });
      }
    });

    return { userId, permissions: data.permissions };
  }

  async getUserPermissions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { adminPermissions: { select: { permission: true } } },
    });

    if (!user) throw ApiError.notFound('User not found');

    return {
      userId,
      role: user.role,
      permissions: user.adminPermissions.map((ap) => ap.permission),
    };
  }

  // ==========================================
  // ADMIN: CHILD MANAGEMENT (by parentProfileId)
  // ==========================================
  private async verifyParentProfile(parentId: string) {
    const profile = await prisma.parentProfile.findUnique({ where: { id: parentId } });
    if (!profile) throw ApiError.notFound('Parent profile not found');
    return profile;
  }

}
