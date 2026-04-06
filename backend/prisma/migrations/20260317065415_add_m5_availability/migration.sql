-- CreateTable
CREATE TABLE "AvailabilityTemplate" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityTemplate_tutorId_idx" ON "AvailabilityTemplate"("tutorId");

-- CreateIndex
CREATE INDEX "AvailabilityTemplate_dayOfWeek_idx" ON "AvailabilityTemplate"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityTemplate_tutorId_dayOfWeek_startTime_endTime_key" ON "AvailabilityTemplate"("tutorId", "dayOfWeek", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "BlockedDate_tutorId_idx" ON "BlockedDate"("tutorId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedDate_tutorId_date_key" ON "BlockedDate"("tutorId", "date");

-- AddForeignKey
ALTER TABLE "AvailabilityTemplate" ADD CONSTRAINT "AvailabilityTemplate_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
