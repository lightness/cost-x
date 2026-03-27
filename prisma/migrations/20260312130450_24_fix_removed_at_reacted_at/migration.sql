/*
  Warnings:

  - You are about to drop the `migration` table. If the table is not empty, all the data it contains will be lost.
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

-- AlterTable
ALTER TABLE "contact" ALTER COLUMN "removed_at" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "invite" ALTER COLUMN "reacted_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_block" ALTER COLUMN "removed_at" SET DATA TYPE TIMESTAMP(6);

-- DropTable
DROP TABLE "migration";

-- CreateIndex
CREATE UNIQUE INDEX "UQ_contact_inviter_id_invitee_id" ON "contact"("source_user_id", "target_user_id") WHERE ("removed_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_invite_inviter_id_invitee_id" ON "invite"("inviter_id", "invitee_id") WHERE ("reacted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_user_block_blocker_id_blocked_id" ON "user_block"("blocker_id", "blocked_id") WHERE ("removed_at" IS NULL);
