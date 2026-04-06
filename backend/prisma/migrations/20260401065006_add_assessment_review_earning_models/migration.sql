-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('UNPAID', 'PAID');

-- AlterTable
ALTER TABLE "Batch" ALTER COLUMN "minStudents" SET DEFAULT 1;

-- CreateTable
CREATE TABLE "AssessmentResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "title" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "percentage" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentDocument" (
    "id" TEXT NOT NULL,
    "assessmentResultId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeKb" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorEarning" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amountInFils" INTEGER NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRecord" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "totalAmountInFils" INTEGER NOT NULL,
    "earningIds" TEXT[],
    "notes" TEXT,
    "paidVia" TEXT,
    "referenceNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentResult_studentId_idx" ON "AssessmentResult"("studentId");

-- CreateIndex
CREATE INDEX "AssessmentResult_tutorId_idx" ON "AssessmentResult"("tutorId");

-- CreateIndex
CREATE INDEX "AssessmentResult_subjectId_idx" ON "AssessmentResult"("subjectId");

-- CreateIndex
CREATE INDEX "AssessmentResult_enrollmentId_idx" ON "AssessmentResult"("enrollmentId");

-- CreateIndex
CREATE INDEX "AssessmentResult_assessedAt_idx" ON "AssessmentResult"("assessedAt");

-- CreateIndex
CREATE INDEX "AssessmentResult_createdAt_idx" ON "AssessmentResult"("createdAt");

-- CreateIndex
CREATE INDEX "AssessmentDocument_assessmentResultId_idx" ON "AssessmentDocument"("assessmentResultId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_tutorId_idx" ON "Review"("tutorId");

-- CreateIndex
CREATE INDEX "Review_parentId_idx" ON "Review"("parentId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TutorEarning_bookingId_key" ON "TutorEarning"("bookingId");

-- CreateIndex
CREATE INDEX "TutorEarning_tutorId_idx" ON "TutorEarning"("tutorId");

-- CreateIndex
CREATE INDEX "TutorEarning_status_idx" ON "TutorEarning"("status");

-- CreateIndex
CREATE INDEX "TutorEarning_createdAt_idx" ON "TutorEarning"("createdAt");

-- CreateIndex
CREATE INDEX "PayoutRecord_tutorId_idx" ON "PayoutRecord"("tutorId");

-- CreateIndex
CREATE INDEX "PayoutRecord_createdAt_idx" ON "PayoutRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentDocument" ADD CONSTRAINT "AssessmentDocument_assessmentResultId_fkey" FOREIGN KEY ("assessmentResultId") REFERENCES "AssessmentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "EnrollmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorEarning" ADD CONSTRAINT "TutorEarning_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorEarning" ADD CONSTRAINT "TutorEarning_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "EnrollmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRecord" ADD CONSTRAINT "PayoutRecord_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
