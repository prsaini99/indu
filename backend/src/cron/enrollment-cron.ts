import cron from 'node-cron';
import { EnrollmentService } from '../modules/enrollment/enrollment.service';
import { BatchService } from '../modules/batch/batch.service';

const enrollmentService = new EnrollmentService();
const batchService = new BatchService();

export function startEnrollmentCron() {
  // Run daily at 00:05 — generate sessions for active enrollments
  cron.schedule('5 0 * * *', async () => {
    console.log('[CRON] Generating enrollment sessions...');
    try {
      const count = await enrollmentService.generateAllActiveSessions();
      console.log(`[CRON] Generated ${count} enrollment sessions`);
    } catch (error) {
      console.error('[CRON] Failed to generate enrollment sessions:', error);
    }
  });

  // Run daily at 00:10 — generate sessions for active batches
  cron.schedule('10 0 * * *', async () => {
    try {
      const count = await batchService.generateAllActiveBatchSessions();
      if (count > 0) console.log(`[CRON] Generated ${count} batch sessions`);
    } catch (error) {
      console.error('[CRON] Failed to generate batch sessions:', error);
    }
  });

  // Run every hour — mark past confirmed sessions as COMPLETED
  cron.schedule('0 * * * *', async () => {
    try {
      const enrollmentCount = await enrollmentService.completePassedSessions();
      const batchCount = await batchService.completePastBatchSessions();
      const total = enrollmentCount + batchCount;
      if (total > 0) console.log(`[CRON] Completed ${enrollmentCount} enrollment + ${batchCount} batch sessions`);
    } catch (error) {
      console.error('[CRON] Failed to complete sessions:', error);
    }
  });

  console.log('[CRON] Enrollment + Batch cron jobs scheduled (generation daily 00:05/00:10, completion hourly)');
}
