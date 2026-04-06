-- CreateEnum
CREATE TYPE "DemoBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "ClassBookingStatus" AS ENUM ('PENDING_VERIFICATION', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- AlterTable: DemoRequest — make parentId optional, add parentName, make contactPhone required
-- First, add parentName with a default for existing rows
ALTER TABLE "DemoRequest" ADD COLUMN "parentName" TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE "DemoRequest" ALTER COLUMN "parentName" DROP DEFAULT;

-- Make parentId optional
ALTER TABLE "DemoRequest" ALTER COLUMN "parentId" DROP NOT NULL;

-- Make contactPhone required (backfill nulls first)
UPDATE "DemoRequest" SET "contactPhone" = '' WHERE "contactPhone" IS NULL;
ALTER TABLE "DemoRequest" ALTER COLUMN "contactPhone" SET NOT NULL;

-- Add index on contactEmail for linking on signup
CREATE INDEX "DemoRequest_contactEmail_idx" ON "DemoRequest"("contactEmail");

-- Add classBookingId to CreditTransaction
ALTER TABLE "CreditTransaction" ADD COLUMN "classBookingId" TEXT;
CREATE UNIQUE INDEX "CreditTransaction_classBookingId_key" ON "CreditTransaction"("classBookingId");

-- CreateTable: DemoBooking
CREATE TABLE "DemoBooking" (
    "id" TEXT NOT NULL,
    "demoRequestId" TEXT,
    "studentId" TEXT,
    "tutorId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" "DemoBookingStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" DATE NOT NULL,
    "scheduledStart" TEXT NOT NULL,
    "scheduledEnd" TEXT NOT NULL,
    "meetingLink" TEXT,
    "meetingPassword" TEXT,
    "parentNotes" TEXT,
    "consultantNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DemoBooking_demoRequestId_key" ON "DemoBooking"("demoRequestId");
CREATE INDEX "DemoBooking_tutorId_idx" ON "DemoBooking"("tutorId");
CREATE INDEX "DemoBooking_consultantId_idx" ON "DemoBooking"("consultantId");
CREATE INDEX "DemoBooking_status_idx" ON "DemoBooking"("status");
CREATE INDEX "DemoBooking_scheduledDate_idx" ON "DemoBooking"("scheduledDate");

-- CreateTable: ClassBooking
CREATE TABLE "ClassBooking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" "ClassBookingStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "creditsCharged" INTEGER NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "scheduledStart" TEXT NOT NULL,
    "scheduledEnd" TEXT NOT NULL,
    "meetingLink" TEXT,
    "meetingPassword" TEXT,
    "parentNotes" TEXT,
    "consultantNotes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassBooking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClassBooking_studentId_idx" ON "ClassBooking"("studentId");
CREATE INDEX "ClassBooking_tutorId_idx" ON "ClassBooking"("tutorId");
CREATE INDEX "ClassBooking_consultantId_idx" ON "ClassBooking"("consultantId");
CREATE INDEX "ClassBooking_status_idx" ON "ClassBooking"("status");
CREATE INDEX "ClassBooking_scheduledDate_idx" ON "ClassBooking"("scheduledDate");
CREATE INDEX "ClassBooking_createdAt_idx" ON "ClassBooking"("createdAt");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_classBookingId_fkey" FOREIGN KEY ("classBookingId") REFERENCES "ClassBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DemoBooking" ADD CONSTRAINT "DemoBooking_demoRequestId_fkey" FOREIGN KEY ("demoRequestId") REFERENCES "DemoRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DemoBooking" ADD CONSTRAINT "DemoBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DemoBooking" ADD CONSTRAINT "DemoBooking_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DemoBooking" ADD CONSTRAINT "DemoBooking_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "ConsultantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DemoBooking" ADD CONSTRAINT "DemoBooking_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "ConsultantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
