-- DropTable
DROP TABLE IF EXISTS "TutorSubject";

-- AlterTable: add tutorRate with a default for existing rows, then remove the default
ALTER TABLE "TutorCourse" ADD COLUMN "tutorRate" INTEGER NOT NULL DEFAULT 5000;
ALTER TABLE "TutorCourse" ALTER COLUMN "tutorRate" DROP DEFAULT;
