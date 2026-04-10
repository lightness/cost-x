-- Add new Permission enum values
ALTER TYPE "Permission" ADD VALUE 'WORKSPACE_INVITE_CREATE';
ALTER TYPE "Permission" ADD VALUE 'WORKSPACE_INVITE_ACCEPT';
ALTER TYPE "Permission" ADD VALUE 'WORKSPACE_INVITE_REJECT';
ALTER TYPE "Permission" ADD VALUE 'WORKSPACE_MEMBER_REMOVE';
ALTER TYPE "Permission" ADD VALUE 'WORKSPACE_INVITE_USER';

-- Add new WorkspaceHistoryAction enum values
ALTER TYPE "WorkspaceHistoryAction" ADD VALUE 'WORKSPACE_MEMBER_JOINED';
ALTER TYPE "WorkspaceHistoryAction" ADD VALUE 'WORKSPACE_MEMBER_REMOVED';

-- CreateEnum
CREATE TYPE "WorkspaceInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable: workspace_member
CREATE TABLE "workspace_member" (
  "id"           SERIAL NOT NULL,
  "workspace_id" INTEGER NOT NULL,
  "user_id"      INTEGER NOT NULL,
  "joined_at"    TIMESTAMP(6) NOT NULL DEFAULT now(),
  CONSTRAINT "PK_workspace_member_id" PRIMARY KEY ("id")
);

ALTER TABLE "workspace_member"
  ADD CONSTRAINT "UQ_workspace_member_workspace_id_user_id" UNIQUE ("workspace_id", "user_id");

ALTER TABLE "workspace_member"
  ADD CONSTRAINT "FK_workspace_member_workspace_id_workspace_id"
  FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "workspace_member"
  ADD CONSTRAINT "FK_workspace_member_user_id_user_id"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable: workspace_member_permission
CREATE TABLE "workspace_member_permission" (
  "workspace_id"  INTEGER NOT NULL,
  "user_id"       INTEGER NOT NULL,
  "permission"    "Permission" NOT NULL,
  "access_level"  INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "workspace_member_permission_pkey" PRIMARY KEY ("workspace_id", "user_id", "permission")
);

ALTER TABLE "workspace_member_permission"
  ADD CONSTRAINT "FK_workspace_member_permission_workspace_id_workspace_id"
  FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "workspace_member_permission"
  ADD CONSTRAINT "FK_workspace_member_permission_user_id_user_id"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable: workspace_invite
CREATE TABLE "workspace_invite" (
  "id"           SERIAL NOT NULL,
  "workspace_id" INTEGER NOT NULL,
  "inviter_id"   INTEGER NOT NULL,
  "invitee_id"   INTEGER NOT NULL,
  "status"       "WorkspaceInviteStatus" NOT NULL,
  "created_at"   TIMESTAMP(6) NOT NULL DEFAULT now(),
  "reacted_at"   TIMESTAMP(6),
  CONSTRAINT "PK_workspace_invite_id" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UQ_workspace_invite_workspace_id_invitee_id"
  ON "workspace_invite" ("workspace_id", "invitee_id")
  WHERE "reacted_at" IS NULL;

ALTER TABLE "workspace_invite"
  ADD CONSTRAINT "FK_workspace_invite_workspace_id_workspace_id"
  FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "workspace_invite"
  ADD CONSTRAINT "FK_workspace_invite_inviter_id_user_id"
  FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "workspace_invite"
  ADD CONSTRAINT "FK_workspace_invite_invitee_id_user_id"
  FOREIGN KEY ("invitee_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable: workspace_invite_permission
CREATE TABLE "workspace_invite_permission" (
  "invite_id"    INTEGER NOT NULL,
  "permission"   "Permission" NOT NULL,
  "access_level" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "workspace_invite_permission_pkey" PRIMARY KEY ("invite_id", "permission")
);

ALTER TABLE "workspace_invite_permission"
  ADD CONSTRAINT "FK_workspace_invite_permission_invite_id_workspace_invite_id"
  FOREIGN KEY ("invite_id") REFERENCES "workspace_invite"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- DataMigration: grant workspace invite/member permissions to all users who already have WORKSPACE_UPDATE
-- (these are existing admin users — everyone who can manage workspaces gets the new management permissions)
INSERT INTO "user_permission" ("user_id", "permission", "access_level")
SELECT "user_id", p.permission, "access_level"
FROM "user_permission"
CROSS JOIN (
  VALUES
    ('WORKSPACE_INVITE_CREATE'::"Permission"),
    ('WORKSPACE_INVITE_ACCEPT'::"Permission"),
    ('WORKSPACE_INVITE_REJECT'::"Permission"),
    ('WORKSPACE_MEMBER_REMOVE'::"Permission"),
    ('WORKSPACE_INVITE_USER'::"Permission")
) AS p(permission)
WHERE "user_permission"."permission" = 'WORKSPACE_UPDATE'::"Permission"
ON CONFLICT DO NOTHING;
