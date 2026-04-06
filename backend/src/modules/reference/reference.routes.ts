import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess } from '../../shared/utils/apiResponse';

const router = Router();

// GET /grades — public, returns all grade levels
router.get('/grades', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const grades = await prisma.gradeLevel.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, sortOrder: true },
    });
    sendSuccess(res, grades);
  } catch (error) {
    next(error);
  }
});

// GET /subjects — public, returns all active subjects
router.get('/subjects', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    sendSuccess(res, subjects);
  } catch (error) {
    next(error);
  }
});

// GET /boards — public, returns all active boards
router.get('/boards', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const boards = await prisma.board.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    sendSuccess(res, boards);
  } catch (error) {
    next(error);
  }
});

export default router;
