-- AlterTable: add is_banned column
ALTER TABLE "user" ADD COLUMN "is_banned" BOOLEAN NOT NULL DEFAULT false;

-- Migrate data: mark existing banned users
UPDATE "user" SET "is_banned" = true WHERE "status" = 'BANNED';

-- Reset status of banned users to ACTIVE before dropping BANNED from enum
UPDATE "user" SET "status" = 'ACTIVE' WHERE "status" = 'BANNED';

-- Swap enum: create new type without BANNED, migrate column, drop old type
CREATE TYPE "UserStatus_new" AS ENUM ('ACTIVE', 'EMAIL_NOT_VERIFIED');

ALTER TABLE "user"
  ALTER COLUMN "status" TYPE "UserStatus_new"
  USING "status"::text::"UserStatus_new";

DROP TYPE "UserStatus";

ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
