-- AlterTable: split temp_code into confirm_email_temp_code and reset_password_temp_code
ALTER TABLE "user"
  ADD COLUMN "confirm_email_temp_code" TEXT,
  ADD COLUMN "reset_password_temp_code" TEXT;

-- Migrate existing confirm email codes (only meaningful for EMAIL_NOT_VERIFIED users)
UPDATE "user"
  SET "confirm_email_temp_code" = "temp_code"
  WHERE "status" = 'EMAIL_NOT_VERIFIED';

-- reset_password_temp_code starts as NULL for all users:
-- reset password tokens expire in 5 minutes so any in-flight codes are already expired

-- Drop the old column
ALTER TABLE "user" DROP COLUMN "temp_code";
