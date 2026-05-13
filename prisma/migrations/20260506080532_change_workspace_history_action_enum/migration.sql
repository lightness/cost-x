/*
  Warnings:

  - The values [ITEM_STAKE_CREATED,ITEM_STAKE_UPDATED] on the enum `WorkspaceHistoryAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WorkspaceHistoryAction_new" AS ENUM ('ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_DELETED', 'PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_DELETED', 'ITEM_TAG_ASSIGNED', 'ITEM_TAG_UNASSIGNED', 'TAG_CREATED', 'TAG_UPDATED', 'TAG_DELETED', 'WORKSPACE_CREATED', 'WORKSPACE_UPDATED', 'WORKSPACE_DELETED', 'ITEM_MERGED', 'ITEM_EXTRACTED', 'WORKSPACE_INVITE_CREATED', 'WORKSPACE_INVITE_ACCEPTED', 'WORKSPACE_INVITE_REJECTED', 'WORKSPACE_INVITE_CANCELLED', 'WORKSPACE_MEMBER_CREATED', 'WORKSPACE_MEMBER_REMOVED', 'ITEM_STAKES_CHANGED');
ALTER TABLE "workspace_history" ALTER COLUMN "action" TYPE "WorkspaceHistoryAction_new" USING ("action"::text::"WorkspaceHistoryAction_new");
ALTER TYPE "WorkspaceHistoryAction" RENAME TO "WorkspaceHistoryAction_old";
ALTER TYPE "WorkspaceHistoryAction_new" RENAME TO "WorkspaceHistoryAction";
DROP TYPE "public"."WorkspaceHistoryAction_old";
COMMIT;
