-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('ONE_TO_ONE', 'GROUP');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "classType" "ClassType" NOT NULL DEFAULT 'ONE_TO_ONE';

-- AlterTable
ALTER TABLE "GradeTier" ADD COLUMN     "credits120Min" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "credits60Min" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "credits90Min" INTEGER NOT NULL DEFAULT 0;
