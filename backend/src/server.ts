// BigInt JSON serialization (Zoom meeting IDs are BigInt)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import logger from './config/logger';
import { startEnrollmentCron } from './cron/enrollment-cron';
import { startRecordingCron } from './cron/recording-cron';
import { startNotificationCron } from './cron/notification-cron';

const start = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('PostgreSQL connected');

    // Start server
    app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
      logger.info(`API: http://localhost:${env.PORT}/api/${env.API_VERSION}`);
      logger.info(`Environment: ${env.NODE_ENV}`);

      // Start cron jobs
      startEnrollmentCron();
      startRecordingCron();
      startNotificationCron();
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
