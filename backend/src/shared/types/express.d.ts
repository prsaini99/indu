import { Role, Permission } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        permissions?: Permission[];
      };
    }
  }
}

export {};
