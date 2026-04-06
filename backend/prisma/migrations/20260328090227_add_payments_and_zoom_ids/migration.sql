/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `CreditTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "DemoBooking" ADD COLUMN     "zoomMeetingId" BIGINT;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "zoomMeetingId" BIGINT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "creditPackageId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amountInFils" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'aed',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_parentId_idx" ON "Payment"("parentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_paymentId_key" ON "CreditTransaction"("paymentId");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_creditPackageId_fkey" FOREIGN KEY ("creditPackageId") REFERENCES "CreditPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
