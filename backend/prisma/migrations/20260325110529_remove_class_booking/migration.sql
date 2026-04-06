/*
  Warnings:

  - You are about to drop the column `classBookingId` on the `CreditTransaction` table. All the data in the column will be lost.
  - You are about to drop the `ClassBooking` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClassBooking" DROP CONSTRAINT "ClassBooking_consultantId_fkey";

-- DropForeignKey
ALTER TABLE "ClassBooking" DROP CONSTRAINT "ClassBooking_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ClassBooking" DROP CONSTRAINT "ClassBooking_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "ClassBooking" DROP CONSTRAINT "ClassBooking_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "CreditTransaction" DROP CONSTRAINT "CreditTransaction_classBookingId_fkey";

-- DropIndex
DROP INDEX "CreditTransaction_classBookingId_key";

-- AlterTable
ALTER TABLE "CreditTransaction" DROP COLUMN "classBookingId";

-- DropTable
DROP TABLE "ClassBooking";

-- DropEnum
DROP TYPE "ClassBookingStatus";
