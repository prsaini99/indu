/*
  Warnings:

  - A unique constraint covering the columns `[enrollmentSessionId]` on the table `CreditTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED_PARENT', 'CANCELLED_LATE', 'SKIPPED');

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "enrollmentSessionId" TEXT;

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "weeklyClassCount" INTEGER NOT NULL,
    "preferredDays" INTEGER[],
    "preferredTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "zoomLink" TEXT,
    "zoomPassword" TEXT,
    "creditsPerSession" INTEGER NOT NULL,
    "lastGeneratedDate" TIMESTAMP(3),
    "pauseReason" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentSession" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" DATE NOT NULL,
    "scheduledStart" TEXT NOT NULL,
    "scheduledEnd" TEXT NOT NULL,
    "creditsCharged" INTEGER NOT NULL,
    "creditDeductedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enrollment_parentId_idx" ON "Enrollment"("parentId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_tutorId_idx" ON "Enrollment"("tutorId");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE INDEX "EnrollmentSession_enrollmentId_idx" ON "EnrollmentSession"("enrollmentId");

-- CreateIndex
CREATE INDEX "EnrollmentSession_scheduledDate_idx" ON "EnrollmentSession"("scheduledDate");

-- CreateIndex
CREATE INDEX "EnrollmentSession_status_idx" ON "EnrollmentSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_enrollmentSessionId_key" ON "CreditTransaction"("enrollmentSessionId");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_enrollmentSessionId_fkey" FOREIGN KEY ("enrollmentSessionId") REFERENCES "EnrollmentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSession" ADD CONSTRAINT "EnrollmentSession_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
