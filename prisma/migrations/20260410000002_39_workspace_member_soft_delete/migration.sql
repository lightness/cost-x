-- Add soft-delete support to workspace_member

ALTER TABLE "workspace_member" ADD COLUMN IF NOT EXISTS "left_at" TIMESTAMP(6);

ALTER TABLE "workspace_member" DROP CONSTRAINT IF EXISTS "UQ_workspace_member_workspace_id_user_id";

DROP INDEX IF EXISTS "UQ_workspace_member_workspace_id_user_id";

CREATE UNIQUE INDEX "UQ_workspace_member_workspace_id_user_id"
  ON "workspace_member" ("workspace_id", "user_id")
  WHERE "left_at" IS NULL;
