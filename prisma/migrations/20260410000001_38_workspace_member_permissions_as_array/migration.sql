-- Drop separate permission tables, store permissions as arrays instead

DROP TABLE "workspace_member_permission";
DROP TABLE "workspace_invite_permission";

ALTER TABLE "workspace_member" ADD COLUMN "permissions" "Permission"[] NOT NULL DEFAULT '{}';
ALTER TABLE "workspace_invite" ADD COLUMN "permissions" "Permission"[] NOT NULL DEFAULT '{}';
