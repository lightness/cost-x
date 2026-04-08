-- AlterTable: drop status column (email verification is now tracked via confirm_email_temp_code)
ALTER TABLE "user" DROP COLUMN "status";

-- DropEnum
DROP TYPE "UserStatus";
