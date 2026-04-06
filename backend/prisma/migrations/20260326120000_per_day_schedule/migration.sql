-- AlterTable: Add schedule column with default, backfill from existing data, then drop old columns

-- Step 1: Add new column with a default
ALTER TABLE "Enrollment" ADD COLUMN "schedule" JSONB NOT NULL DEFAULT '[]';

-- Step 2: Backfill existing rows — convert preferredDays + preferredTime into schedule JSON array
UPDATE "Enrollment"
SET "schedule" = (
  SELECT jsonb_agg(
    jsonb_build_object('dayOfWeek', d, 'startTime', "preferredTime")
  )
  FROM unnest("preferredDays") AS d
)
WHERE "preferredDays" IS NOT NULL AND array_length("preferredDays", 1) > 0;

-- Step 3: Drop old columns
ALTER TABLE "Enrollment" DROP COLUMN "weeklyClassCount";
ALTER TABLE "Enrollment" DROP COLUMN "preferredDays";
ALTER TABLE "Enrollment" DROP COLUMN "preferredTime";
