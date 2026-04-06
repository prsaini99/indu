const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tutor = await prisma.tutorProfile.findFirst({ where: { isActive: true }, select: { id: true, firstName: true, userId: true } });
  const parent = await prisma.parentProfile.findFirst({ include: { children: { where: { deletedAt: null }, take: 1, include: { grade: true } } } });
  const subject = await prisma.subject.findFirst({ where: { isActive: true } });
  const subject2 = await prisma.subject.findFirst({ where: { isActive: true, id: { not: subject.id } } });

  if (!tutor || !parent || !parent.children[0] || !subject) {
    console.log('Missing base data'); return;
  }

  const child = parent.children[0];
  console.log('Tutor:', tutor.firstName, tutor.id.slice(0,8));
  console.log('Parent:', parent.firstName, parent.id.slice(0,8));
  console.log('Child:', child.firstName, child.id.slice(0,8));

  // Find or create completed sessions
  const enrollment = await prisma.enrollment.findFirst({ where: { tutorId: tutor.id, parentId: parent.id } });
  const sessions = [];

  if (enrollment) {
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (2 + i * 3));
      const dateStr = d.toISOString().slice(0, 10);
      try {
        const sess = await prisma.enrollmentSession.create({
          data: {
            enrollmentId: enrollment.id,
            status: 'COMPLETED',
            scheduledDate: new Date(dateStr + 'T12:00:00Z'),
            scheduledStart: '14:00',
            scheduledEnd: '15:00',
            creditsCharged: 2,
            creditDeductedAt: new Date(),
          },
        });
        sessions.push(sess);
        console.log('Session created:', dateStr);
      } catch (err) {
        // unique constraint — skip
      }
    }
  }

  // M11: Assessment Results
  console.log('\n--- Assessments ---');
  const dates = [30, 20, 14, 7, 2];
  for (let i = 0; i < dates.length; i++) {
    const d = new Date();
    d.setDate(d.getDate() - dates[i]);
    const score = 60 + Math.floor(Math.random() * 35);
    await prisma.assessmentResult.create({
      data: {
        studentId: child.id,
        tutorId: tutor.id,
        subjectId: i < 3 ? subject.id : (subject2 || subject).id,
        enrollmentId: enrollment?.id || null,
        title: i < 3 ? subject.name + ' Test ' + (i + 1) : (subject2 || subject).name + ' Quiz ' + (i - 2),
        score,
        maxScore: 100,
        percentage: score,
        remarks: score >= 80 ? 'Excellent work!' : score >= 70 ? 'Good progress.' : 'Needs improvement.',
        assessedAt: d,
      },
    });
    console.log('  ' + score + '/100 (' + dates[i] + 'd ago)');
  }

  // M15: Reviews
  console.log('\n--- Reviews ---');
  const ratings = [5, 4, 5, 3];
  const comments = [
    'Excellent tutor! My child improved significantly.',
    'Very good teaching style, my child enjoys sessions.',
    'Best tutor we have had! Highly recommend.',
    'Good but sometimes classes run over time.',
  ];
  for (let i = 0; i < Math.min(sessions.length, 4); i++) {
    try {
      await prisma.review.create({
        data: {
          bookingId: sessions[i].id,
          tutorId: tutor.id,
          parentId: parent.id,
          rating: ratings[i],
          comment: comments[i],
          isVisible: i !== 3,
        },
      });
      console.log('  ' + ratings[i] + ' stars' + (i === 3 ? ' (hidden)' : ''));
    } catch (err) { /* duplicate */ }
  }

  // M16: Earnings
  console.log('\n--- Earnings ---');
  for (const sess of sessions) {
    const existing = await prisma.tutorEarning.findUnique({ where: { bookingId: sess.id } });
    if (!existing) {
      const isPaid = Math.random() > 0.5;
      const amt = 50000 + Math.floor(Math.random() * 30000);
      await prisma.tutorEarning.create({
        data: {
          tutorId: tutor.id,
          bookingId: sess.id,
          amountInPaise: amt,
          status: isPaid ? 'PAID' : 'UNPAID',
          paidAt: isPaid ? new Date() : null,
        },
      });
      console.log('  Rs.' + (amt / 100) + (isPaid ? ' PAID' : ' UNPAID'));
    }
  }

  // Payout record
  const paidEarnings = await prisma.tutorEarning.findMany({
    where: { tutorId: tutor.id, status: 'PAID' },
    select: { id: true, amountInPaise: true },
  });
  if (paidEarnings.length > 0) {
    const total = paidEarnings.reduce((s, e) => s + e.amountInPaise, 0);
    const existing = await prisma.payoutRecord.findFirst({ where: { tutorId: tutor.id } });
    if (!existing) {
      await prisma.payoutRecord.create({
        data: {
          tutorId: tutor.id,
          totalAmountInPaise: total,
          earningIds: paidEarnings.map(e => e.id),
          paidVia: 'Bank Transfer',
          referenceNo: 'TXN-' + Date.now().toString().slice(-8),
          notes: 'Monthly payout March 2026',
        },
      });
      console.log('  Payout: Rs.' + (total / 100));
    }
  }

  console.log('\nDone!');
}
main().then(() => prisma.$disconnect());
