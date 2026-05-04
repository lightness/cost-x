-- AlterTable
ALTER TABLE "workspace_invite" ALTER COLUMN "permissions" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "IDX_workspace_invite_invitee_id" ON "workspace_invite"("invitee_id");
