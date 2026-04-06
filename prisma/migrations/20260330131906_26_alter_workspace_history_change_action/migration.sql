/*
  Warnings:

  - Changed the type of `action` on the `workspace_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WorkspaceHistoryAction" AS ENUM ('ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_DELETED', 'PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_DELETED', 'TAG_ADDED', 'TAG_REMOVED');

-- AlterTable
ALTER TABLE "workspace_history" DROP COLUMN "action",
ADD COLUMN     "action" "WorkspaceHistoryAction" NOT NULL;
