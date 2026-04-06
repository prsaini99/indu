-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "lastPausedAt" TIMESTAMP(3),
ADD COLUMN     "lastResumedAt" TIMESTAMP(3),
ADD COLUMN     "pauseCountMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pauseCountResetAt" TIMESTAMP(3),
ALTER COLUMN "schedule" DROP DEFAULT;
