-- Rename: tutors are paid in INR (paise), not AED (fils)
ALTER TABLE "TutorEarning" RENAME COLUMN "amountInFils" TO "amountInPaise";
ALTER TABLE "PayoutRecord" RENAME COLUMN "totalAmountInFils" TO "totalAmountInPaise";
