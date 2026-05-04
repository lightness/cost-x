/*
  Warnings:

  - You are about to drop the column `removed_by_id` on the `workspace_member` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_workspace_member_removed_by_id_user_id";

-- AlterTable
ALTER TABLE "workspace_member" DROP COLUMN "removed_by_id",
ADD COLUMN     "removed_by_user_id" INTEGER;

-- AddForeignKey
ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_workspace_member_removed_by_user_id_user_id" FOREIGN KEY ("removed_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
