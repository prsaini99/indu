import { beforeAll, afterAll } from 'vitest';
import prisma from '../config/database';

beforeAll(async () => {
  // Ensure DB is reachable
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
