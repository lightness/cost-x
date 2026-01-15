/*
  Warnings:

  - You are about to drop the `Workspace` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `workspace_id` to the `item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "FK_workspace_owner_id_user_id";

-- AlterTable
ALTER TABLE "item" ADD COLUMN     "workspace_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Workspace";

-- CreateTable
CREATE TABLE "workspace" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" VARCHAR(255) NOT NULL,
    "owner_id" INTEGER NOT NULL,

    CONSTRAINT "PK_workspace_id" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "FK_item_workspace_id_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workspace" ADD CONSTRAINT "FK_workspace_owner_id_user_id" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
