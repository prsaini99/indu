import cron from 'node-cron';
import { RecordingService } from '../modules/recording/recording.service';

const recordingService = new RecordingService();

// In-process lock to prevent concurrent cron runs
let isProcessing = false;
let isCleaning = false;

export function startRecordingCron() {
  // Job 1: Process pending recording files (every 2 minutes)
  cron.schedule('*/2 * * * *', async () => {
    if (isProcessing) return; // Skip if previous run still running
    isProcessing = true;
    try {
      const processed = await recordingService.processPendingFiles();
      if (processed > 0) {
        console.log(`[Recording Cron] Processed ${processed} recording file(s)`);
      }
    } catch (err) {
      console.error('[Recording Cron] Process pending files failed:', err);
    } finally {
      isProcessing = false;
    }
  });

  // Job 2: Cleanup Zoom recordings after 2hr buffer (every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    if (isCleaning) return;
    isCleaning = true;
    try {
      const deleted = await recordingService.cleanupZoomRecordings();
      if (deleted > 0) {
        console.log(`[Recording Cron] Deleted ${deleted} Zoom recording(s)`);
      }
    } catch (err) {
      console.error('[Recording Cron] Zoom cleanup failed:', err);
    } finally {
      isCleaning = false;
    }
  });

  // Job 3: Poll for missed recordings (every 6 hours)
  cron.schedule('0 */6 * * *', async () => {
    try {
      const found = await recordingService.pollMissedRecordings();
      if (found > 0) {
        console.log(`[Recording Cron] Found ${found} session(s) missing recordings`);
      }
    } catch (err) {
      console.error('[Recording Cron] Poll missed recordings failed:', err);
    }
  });

  console.log('[CRON] Recording cron jobs scheduled (process 2min, cleanup 30min, poll 6hr)');
}
