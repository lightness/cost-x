/*
  Warnings:

  - A unique constraint covering the columns `[source_user_id,target_user_id]` on the table `contact` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inviter_id,invitee_id]` on the table `invite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[blocker_id,blocked_id]` on the table `user_block` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UQ_contact_inviter_id_invitee_id";

-- DropIndex
DROP INDEX "UQ_invite_inviter_id_invitee_id";

-- DropIndex
DROP INDEX "UQ_user_block_blocker_id_blocked_id";

-- CreateIndex
CREATE UNIQUE INDEX "UQ_contact_inviter_id_invitee_id" ON "contact"("source_user_id", "target_user_id") WHERE ("removed_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_invite_inviter_id_invitee_id" ON "invite"("inviter_id", "invitee_id") WHERE ("reacted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_user_block_blocker_id_blocked_id" ON "user_block"("blocker_id", "blocked_id") WHERE ("removed_at" IS NULL);

-- AddForeignKey
ALTER TABLE "user_block" ADD CONSTRAINT "FK_user_block_removed_by_user_id_user_id" FOREIGN KEY ("removed_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
