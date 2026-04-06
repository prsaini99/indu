// BigInt JSON serialization (Zoom meeting IDs are BigInt) — must run before app import
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { beforeAll, afterAll } from 'vitest';
import prisma from '../config/database';

beforeAll(async () => {
  // Ensure DB is reachable
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
