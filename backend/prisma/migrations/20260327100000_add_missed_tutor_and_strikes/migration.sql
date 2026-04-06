-- AlterEnum: Add MISSED_TUTOR to SessionStatus
ALTER TYPE "SessionStatus" ADD VALUE 'MISSED_TUTOR';

-- AlterTable: Add strike tracking to TutorProfile
ALTER TABLE "TutorProfile" ADD COLUMN "noShowStrikes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TutorProfile" ADD COLUMN "lastStrikeAt" TIMESTAMP(3);
