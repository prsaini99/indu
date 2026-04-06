/*
  Warnings:

  - A unique constraint covering the columns `[batchSessionCreditId]` on the table `CreditTransaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[batchSessionId]` on the table `Recording` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('OPEN', 'FULL', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "batchSessionCreditId" TEXT;

-- AlterTable
ALTER TABLE "Recording" ADD COLUMN     "batchSessionId" TEXT;

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'OPEN',
    "schedule" JSONB NOT NULL,
    "duration" INTEGER NOT NULL,
    "minStudents" INTEGER NOT NULL DEFAULT 2,
    "maxStudents" INTEGER NOT NULL DEFAULT 6,
    "creditsPerSession" INTEGER NOT NULL,
    "zoomLink" TEXT,
    "zoomPassword" TEXT,
    "zoomMeetingId" BIGINT,
    "startDate" DATE,
    "lastGeneratedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchStudent" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "leaveReason" TEXT,

    CONSTRAINT "BatchStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchSession" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" DATE NOT NULL,
    "scheduledStart" TEXT NOT NULL,
    "scheduledEnd" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchSessionCredit" (
    "id" TEXT NOT NULL,
    "batchSessionId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "creditsCharged" INTEGER NOT NULL,
    "creditDeductedAt" TIMESTAMP(3),

    CONSTRAINT "BatchSessionCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Batch_status_idx" ON "Batch"("status");

-- CreateIndex
CREATE INDEX "Batch_subjectId_idx" ON "Batch"("subjectId");

-- CreateIndex
CREATE INDEX "Batch_tutorId_idx" ON "Batch"("tutorId");

-- CreateIndex
CREATE INDEX "Batch_gradeId_idx" ON "Batch"("gradeId");

-- CreateIndex
CREATE INDEX "BatchStudent_batchId_idx" ON "BatchStudent"("batchId");

-- CreateIndex
CREATE INDEX "BatchStudent_studentId_idx" ON "BatchStudent"("studentId");

-- CreateIndex
CREATE INDEX "BatchStudent_parentId_idx" ON "BatchStudent"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "BatchStudent_batchId_studentId_key" ON "BatchStudent"("batchId", "studentId");

-- CreateIndex
CREATE INDEX "BatchSession_batchId_idx" ON "BatchSession"("batchId");

-- CreateIndex
CREATE INDEX "BatchSession_scheduledDate_idx" ON "BatchSession"("scheduledDate");

-- CreateIndex
CREATE INDEX "BatchSession_status_idx" ON "BatchSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BatchSession_batchId_scheduledDate_scheduledStart_key" ON "BatchSession"("batchId", "scheduledDate", "scheduledStart");

-- CreateIndex
CREATE INDEX "BatchSessionCredit_batchSessionId_idx" ON "BatchSessionCredit"("batchSessionId");

-- CreateIndex
CREATE INDEX "BatchSessionCredit_parentId_idx" ON "BatchSessionCredit"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "BatchSessionCredit_batchSessionId_studentId_key" ON "BatchSessionCredit"("batchSessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_batchSessionCreditId_key" ON "CreditTransaction"("batchSessionCreditId");

-- CreateIndex
CREATE UNIQUE INDEX "Recording_batchSessionId_key" ON "Recording"("batchSessionId");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_batchSessionCreditId_fkey" FOREIGN KEY ("batchSessionCreditId") REFERENCES "BatchSessionCredit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_batchSessionId_fkey" FOREIGN KEY ("batchSessionId") REFERENCES "BatchSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "GradeLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchStudent" ADD CONSTRAINT "BatchStudent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchStudent" ADD CONSTRAINT "BatchStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchStudent" ADD CONSTRAINT "BatchStudent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSession" ADD CONSTRAINT "BatchSession_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSessionCredit" ADD CONSTRAINT "BatchSessionCredit_batchSessionId_fkey" FOREIGN KEY ("batchSessionId") REFERENCES "BatchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
