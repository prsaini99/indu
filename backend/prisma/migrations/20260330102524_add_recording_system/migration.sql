-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('PENDING', 'PROCESSING', 'AVAILABLE', 'FAILED');

-- CreateEnum
CREATE TYPE "RecordingFileType" AS ENUM ('VIDEO', 'AUDIO', 'CHAT', 'TRANSCRIPT');

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "enrollmentSessionId" TEXT,
    "demoBookingId" TEXT,
    "zoomMeetingId" BIGINT NOT NULL,
    "zoomMeetingUuid" TEXT NOT NULL,
    "meetingTopic" TEXT,
    "meetingDuration" INTEGER,
    "status" "RecordingStatus" NOT NULL DEFAULT 'PENDING',
    "webhookEventId" TEXT,
    "readyForZoomDeletion" TIMESTAMP(3),
    "zoomDeletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingFile" (
    "id" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "zoomFileId" TEXT NOT NULL,
    "fileType" "RecordingFileType" NOT NULL,
    "fileExtension" TEXT NOT NULL,
    "recordingType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "durationSeconds" INTEGER,
    "zoomDownloadUrl" TEXT NOT NULL,
    "s3Key" TEXT,
    "s3Bucket" TEXT,
    "status" "RecordingStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordingFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recording_enrollmentSessionId_key" ON "Recording"("enrollmentSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Recording_demoBookingId_key" ON "Recording"("demoBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Recording_zoomMeetingUuid_key" ON "Recording"("zoomMeetingUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Recording_webhookEventId_key" ON "Recording"("webhookEventId");

-- CreateIndex
CREATE INDEX "Recording_zoomMeetingId_idx" ON "Recording"("zoomMeetingId");

-- CreateIndex
CREATE INDEX "Recording_status_idx" ON "Recording"("status");

-- CreateIndex
CREATE INDEX "Recording_createdAt_idx" ON "Recording"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecordingFile_zoomFileId_key" ON "RecordingFile"("zoomFileId");

-- CreateIndex
CREATE INDEX "RecordingFile_recordingId_idx" ON "RecordingFile"("recordingId");

-- CreateIndex
CREATE INDEX "RecordingFile_status_retryCount_idx" ON "RecordingFile"("status", "retryCount");

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_enrollmentSessionId_fkey" FOREIGN KEY ("enrollmentSessionId") REFERENCES "EnrollmentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_demoBookingId_fkey" FOREIGN KEY ("demoBookingId") REFERENCES "DemoBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingFile" ADD CONSTRAINT "RecordingFile_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "Recording"("id") ON DELETE CASCADE ON UPDATE CASCADE;
