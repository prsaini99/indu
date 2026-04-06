import { PrismaClient, Role, Permission } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@induae.com' },
    update: {},
    create: {
      email: 'admin@induae.com',
      passwordHash: adminPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
  });
  console.log(`Super Admin created: ${superAdmin.email}`);

  // 1b. Create test accounts for all roles
  const testPassword = await bcrypt.hash('Test123!', 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'testadmin@induae.com' },
    update: {},
    create: {
      email: 'testadmin@induae.com',
      passwordHash: testPassword,
      role: Role.ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
  });
  // Give admin all permissions except system_config
  const adminPerms = Object.values(Permission).filter(p => p !== Permission.SYSTEM_CONFIG);
  for (const perm of adminPerms) {
    await prisma.adminPermission.upsert({
      where: { userId_permission: { userId: admin.id, permission: perm } },
      update: {},
      create: { userId: admin.id, permission: perm },
    });
  }
  console.log(`Admin created: ${admin.email}`);

  // Parent
  const parentUser = await prisma.user.upsert({
    where: { email: 'testparent@induae.com' },
    update: {},
    create: {
      email: 'testparent@induae.com',
      passwordHash: testPassword,
      role: Role.PARENT,
      isActive: true,
      isEmailVerified: true,
    },
  });
  await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      firstName: 'Test',
      lastName: 'Parent',
      phone: '+971501234567',
    },
  });
  console.log(`Parent created: ${parentUser.email}`);

  // Tutor
  const tutorUser = await prisma.user.upsert({
    where: { email: 'testtutor@induae.com' },
    update: {},
    create: {
      email: 'testtutor@induae.com',
      passwordHash: testPassword,
      role: Role.TUTOR,
      isActive: true,
      isEmailVerified: true,
    },
  });
  await prisma.tutorProfile.upsert({
    where: { userId: tutorUser.id },
    update: {},
    create: {
      userId: tutorUser.id,
      firstName: 'Test',
      lastName: 'Tutor',
      phone: '+971502345678',
      bio: 'Experienced tutor specializing in Mathematics and Science.',
      experience: 5,
      isActive: true,
    },
  });
  console.log(`Tutor created: ${tutorUser.email}`);

  // Consultant
  const consultantUser = await prisma.user.upsert({
    where: { email: 'testconsultant@induae.com' },
    update: {},
    create: {
      email: 'testconsultant@induae.com',
      passwordHash: testPassword,
      role: Role.CONSULTANT,
      isActive: true,
      isEmailVerified: true,
    },
  });
  await prisma.consultantProfile.upsert({
    where: { userId: consultantUser.id },
    update: {},
    create: {
      userId: consultantUser.id,
      firstName: 'Test',
      lastName: 'Consultant',
      phone: '+971503456789',
    },
  });
  console.log(`Consultant created: ${consultantUser.email}`);

  // 2. Create Grade Tiers
  const tier1 = await prisma.gradeTier.upsert({
    where: { name: 'Tier 1 (Grade 1-6)' },
    update: {},
    create: {
      name: 'Tier 1 (Grade 1-6)',
      creditsPerClass: 2,
      credits60Min: 2,
      credits90Min: 3,
      credits120Min: 4,
      minGrade: 1,
      maxGrade: 6,
    },
  });

  const tier2 = await prisma.gradeTier.upsert({
    where: { name: 'Tier 2 (Grade 7-12)' },
    update: {},
    create: {
      name: 'Tier 2 (Grade 7-12)',
      creditsPerClass: 3,
      credits60Min: 3,
      credits90Min: 4,
      credits120Min: 5,
      minGrade: 7,
      maxGrade: 12,
    },
  });
  console.log('Grade tiers created');

  // 3. Create Grade Levels (1-12)
  for (let i = 1; i <= 12; i++) {
    const tier = i <= 6 ? tier1 : tier2;
    await prisma.gradeLevel.upsert({
      where: { name: `Grade ${i}` },
      update: {},
      create: {
        name: `Grade ${i}`,
        sortOrder: i,
        tierId: tier.id,
      },
    });
  }
  console.log('Grade levels (1-12) created');

  // 4. Create Subjects
  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Arabic',
    'Computer Science',
    'Economics',
    'Business Studies',
  ];

  for (const name of subjects) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`${subjects.length} subjects created`);

  // 5. Create Boards
  const boards = ['CBSE', 'ICSE', 'IB', 'Cambridge', 'State Board', 'Other'];
  for (const name of boards) {
    await prisma.board.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`${boards.length} boards created`);

  // 6. Get test tutor profile for later course assignments
  const testTutorProfile = await prisma.tutorProfile.findFirst({ where: { userId: tutorUser.id } });

  // 7. Create sample Courses (Subject + GradeLevel)
  const allGrades = await prisma.gradeLevel.findMany({ orderBy: { sortOrder: 'asc' } });
  const allSubjects = await prisma.subject.findMany();

  const courseConfigs = [
    { subject: 'Mathematics', grade: 'Grade 5' },
    { subject: 'Mathematics', grade: 'Grade 10' },
    { subject: 'Physics', grade: 'Grade 9' },
    { subject: 'English', grade: 'Grade 3' },
    { subject: 'Chemistry', grade: 'Grade 11' },
  ];

  for (const cfg of courseConfigs) {
    const sub = allSubjects.find(s => s.name === cfg.subject);
    const grd = allGrades.find(g => g.name === cfg.grade);
    if (sub && grd) {
      await prisma.course.upsert({
        where: { subjectId_gradeId: { subjectId: sub.id, gradeId: grd.id } },
        update: {},
        create: {
          subjectId: sub.id,
          gradeId: grd.id,
          name: `${cfg.subject} — ${cfg.grade}`,
        },
      });
    }
  }
  console.log(`${courseConfigs.length} sample courses created`);

  // 8. Assign test tutor to courses
  if (testTutorProfile) {
    const mathGrade5 = await prisma.course.findFirst({
      where: { subject: { name: 'Mathematics' }, grade: { name: 'Grade 5' } },
    });
    const mathGrade10 = await prisma.course.findFirst({
      where: { subject: { name: 'Mathematics' }, grade: { name: 'Grade 10' } },
    });
    const physicsGrade9 = await prisma.course.findFirst({
      where: { subject: { name: 'Physics' }, grade: { name: 'Grade 9' } },
    });
    const englishGrade3 = await prisma.course.findFirst({
      where: { subject: { name: 'English' }, grade: { name: 'Grade 3' } },
    });

    const courseRates: [typeof mathGrade5, number][] = [
      [mathGrade5, 5000],    // 50 AED
      [mathGrade10, 6000],   // 60 AED
      [physicsGrade9, 5500], // 55 AED
      [englishGrade3, 4500], // 45 AED
    ];
    for (const [course, rate] of courseRates) {
      if (course) {
        await prisma.tutorCourse.upsert({
          where: { tutorId_courseId: { tutorId: testTutorProfile.id, courseId: course.id } },
          update: {},
          create: { tutorId: testTutorProfile.id, courseId: course.id, tutorRate: rate },
        });
      }
    }
    console.log('Test tutor assigned to courses');
  }

  // 9. Create Credit Packages
  const creditPackages = [
    { name: 'Starter Pack', credits: 10, priceInFils: 5000, sortOrder: 1 },
    { name: 'Standard Pack', credits: 25, priceInFils: 10000, sortOrder: 2 },
    { name: 'Premium Pack', credits: 50, priceInFils: 20000, sortOrder: 3 },
  ];

  for (const pkg of creditPackages) {
    await prisma.creditPackage.upsert({
      where: { name: pkg.name },
      update: {},
      create: pkg,
    });
  }
  console.log(`${creditPackages.length} credit packages created`);

  // 10. Give test parent some initial credits
  const testParentProfile = await prisma.parentProfile.findFirst({ where: { userId: parentUser.id } });
  if (testParentProfile) {
    const existingTx = await prisma.creditTransaction.findFirst({
      where: { parentId: testParentProfile.id, type: 'PURCHASE' },
    });
    if (!existingTx) {
      await prisma.creditTransaction.create({
        data: {
          parentId: testParentProfile.id,
          type: 'PURCHASE',
          amount: 20,
          description: 'Welcome bonus — 20 credits',
        },
      });
      console.log('Test parent given 20 initial credits');
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
