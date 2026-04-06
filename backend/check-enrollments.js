const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const e = await p.enrollment.findMany({
    select: { id: true, status: true, student: { select: { firstName: true } }, subject: { select: { name: true } } }
  });
  e.forEach(x => console.log(x.id.substring(0, 8), x.status, x.student.firstName, x.subject.name));
  await p.$disconnect();
})();
