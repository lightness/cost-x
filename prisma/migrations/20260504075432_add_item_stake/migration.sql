-- CreateEnum
CREATE TYPE "StakeRule" AS ENUM ('ALL_REPORTER', 'ALL_OWNER', 'EQUALLY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkspacePermission" ADD VALUE 'UPDATE_WORKSPACE_STAKE_RULE';
ALTER TYPE "WorkspacePermission" ADD VALUE 'CHANGE_ITEM_STAKE';

-- AlterTable
ALTER TABLE "workspace" ADD COLUMN     "stake_rule" "StakeRule" NOT NULL DEFAULT 'ALL_REPORTER';

-- CreateTable
CREATE TABLE "item_stake" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "workspace_member_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PK_item_stake_id" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_item_stake_item_id_workspace_member_id" ON "item_stake"("item_id", "workspace_member_id");

-- AddForeignKey
ALTER TABLE "item_stake" ADD CONSTRAINT "FK_item_stake_item_id_item_id" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_stake" ADD CONSTRAINT "FK_item_stake_workspace_member_id_workspace_member_id" FOREIGN KEY ("workspace_member_id") REFERENCES "workspace_member"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
