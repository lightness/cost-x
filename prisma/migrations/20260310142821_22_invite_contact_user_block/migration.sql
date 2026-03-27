/*
  Warnings:

  - You are about to drop the column `acceptedAt` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `blockedAt` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `invitedAt` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `invitee_id` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `inviter_id` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `removedAt` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `contact` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[source_user_id,target_user_id]` on the table `contact` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invite_id` to the `contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source_user_id` to the `contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_user_id` to the `contact` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "contact" DROP CONSTRAINT "FK_contact_invitee_id_user_id";

-- DropForeignKey
ALTER TABLE "contact" DROP CONSTRAINT "FK_contact_inviter_id_user_id";

-- DropIndex
DROP INDEX "UQ_contact_inviter_id_invitee_id";

-- AlterTable
ALTER TABLE "contact" DROP COLUMN "acceptedAt",
DROP COLUMN "blockedAt",
DROP COLUMN "invitedAt",
DROP COLUMN "invitee_id",
DROP COLUMN "inviter_id",
DROP COLUMN "rejectedAt",
DROP COLUMN "removedAt",
DROP COLUMN "status",
DROP COLUMN "updated_at",
ADD COLUMN     "invite_id" INTEGER NOT NULL,
ADD COLUMN     "removed_at" TIMESTAMP(3),
ADD COLUMN     "removed_by_user_id" INTEGER,
ADD COLUMN     "source_user_id" INTEGER NOT NULL,
ADD COLUMN     "target_user_id" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "ContactStatus";

-- CreateTable
CREATE TABLE "invite" (
    "id" SERIAL NOT NULL,
    "inviter_id" INTEGER NOT NULL,
    "invitee_id" INTEGER NOT NULL,
    "status" "InviteStatus" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reacted_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_invite_id" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_block" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocker_id" INTEGER NOT NULL,
    "blocked_id" INTEGER NOT NULL,
    "removed_at" TIMESTAMP(3),
    "removed_by_user_id" INTEGER,

    CONSTRAINT "PK_block_id" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_invite_inviter_id_invitee_id" ON "invite"("inviter_id", "invitee_id") WHERE ("reacted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_user_block_blocker_id_blocked_id" ON "user_block"("blocker_id", "blocked_id") WHERE ("removed_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_contact_inviter_id_invitee_id" ON "contact"("source_user_id", "target_user_id") WHERE ("removed_at" IS NULL);

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "FK_invite_inviter_id_user_id" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "FK_invite_invitee_id_user_id" FOREIGN KEY ("invitee_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "FK_contact_source_user_id_user_id" FOREIGN KEY ("source_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "FK_contact_target_user_id_user_id" FOREIGN KEY ("target_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "FK_contact_removed_by_user_id_user_id" FOREIGN KEY ("removed_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "FK_contact_invite_id_invite_id" FOREIGN KEY ("invite_id") REFERENCES "invite"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_block" ADD CONSTRAINT "FK_user_block_blocker_id_user_id" FOREIGN KEY ("blocker_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_block" ADD CONSTRAINT "FK_user_block_blocked_id_user_id" FOREIGN KEY ("blocked_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
