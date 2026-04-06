import { z } from 'zod';

export const notificationIdParam = z.object({
  id: z.string().uuid(),
});

export const notificationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
});
