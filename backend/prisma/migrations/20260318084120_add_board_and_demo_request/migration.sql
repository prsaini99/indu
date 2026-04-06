-- CreateEnum
CREATE TYPE "DemoRequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimeSlotPreference" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoRequest" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "childFirstName" TEXT NOT NULL,
    "childLastName" TEXT NOT NULL,
    "childDateOfBirth" TIMESTAMP(3),
    "boardId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "preferredTimeSlot" "TimeSlotPreference" NOT NULL,
    "preferredDate" DATE NOT NULL,
    "alternativeDate" DATE,
    "notes" TEXT,
    "status" "DemoRequestStatus" NOT NULL DEFAULT 'PENDING',
    "consultantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoRequestSubject" (
    "id" TEXT NOT NULL,
    "demoRequestId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "DemoRequestSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Board_name_key" ON "Board"("name");

-- CreateIndex
CREATE INDEX "Board_name_idx" ON "Board"("name");

-- CreateIndex
CREATE INDEX "DemoRequest_parentId_idx" ON "DemoRequest"("parentId");

-- CreateIndex
CREATE INDEX "DemoRequest_status_idx" ON "DemoRequest"("status");

-- CreateIndex
CREATE INDEX "DemoRequest_consultantId_idx" ON "DemoRequest"("consultantId");

-- CreateIndex
CREATE INDEX "DemoRequest_createdAt_idx" ON "DemoRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DemoRequestSubject_demoRequestId_subjectId_key" ON "DemoRequestSubject"("demoRequestId", "subjectId");

-- AddForeignKey
ALTER TABLE "DemoRequest" ADD CONSTRAINT "DemoRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoRequest" ADD CONSTRAINT "DemoRequest_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoRequest" ADD CONSTRAINT "DemoRequest_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "GradeLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoRequest" ADD CONSTRAINT "DemoRequest_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "ConsultantProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoRequestSubject" ADD CONSTRAINT "DemoRequestSubject_demoRequestId_fkey" FOREIGN KEY ("demoRequestId") REFERENCES "DemoRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoRequestSubject" ADD CONSTRAINT "DemoRequestSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
