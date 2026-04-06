/*
  Warnings:

  - A unique constraint covering the columns `[enrollmentId,scheduledDate,scheduledStart]` on the table `EnrollmentSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Dubai';

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentSession_enrollmentId_scheduledDate_scheduledStart_key" ON "EnrollmentSession"("enrollmentId", "scheduledDate", "scheduledStart");
