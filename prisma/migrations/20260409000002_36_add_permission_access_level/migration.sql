ALTER TABLE "user_permission" ADD COLUMN "access_level" INTEGER NOT NULL DEFAULT 1;

-- Existing permissions belong to admin users (migrated from role=ADMIN), grant full access
UPDATE "user_permission" SET "access_level" = 3;
