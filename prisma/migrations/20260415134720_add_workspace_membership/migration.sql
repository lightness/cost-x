-- CreateEnum
CREATE TYPE "WorkspaceInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
ALTER TYPE "WorkspaceHistoryAction" ADD VALUE 'MEMBER_JOINED';

-- CreateTable
CREATE TABLE "workspace_invite" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "inviter_id" INTEGER NOT NULL,
    "invitee_id" INTEGER NOT NULL,
    "status" "WorkspaceInviteStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reacted_at" TIMESTAMP(6),

    CONSTRAINT "PK_workspace_invite_id" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_member" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "invite_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(6),
    "removed_by_id" INTEGER,

    CONSTRAINT "PK_workspace_member_id" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_workspace_invite_workspace_id_invitee_id" ON "workspace_invite"("workspace_id", "invitee_id") WHERE ("reacted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_member_invite_id_key" ON "workspace_member"("invite_id");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_workspace_member_workspace_id_user_id" ON "workspace_member"("workspace_id", "user_id") WHERE ("removed_at" IS NULL);

-- AddForeignKey
ALTER TABLE "workspace_invite" ADD CONSTRAINT "FK_workspace_invite_workspace_id_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workspace_invite" ADD CONSTRAINT "FK_workspace_invite_inviter_id_user_id" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workspace_invite" ADD CONSTRAINT "FK_workspace_invite_invitee_id_user_id" FOREIGN KEY ("invitee_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_workspace_member_workspace_id_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_workspace_member_user_id_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_workspace_member_invite_id_workspace_invite_id" FOREIGN KEY ("invite_id") REFERENCES "workspace_invite"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_workspace_member_removed_by_id_user_id" FOREIGN KEY ("removed_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
