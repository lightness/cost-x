/*
  Warnings:

  - The values [TAG_ADDED,TAG_REMOVED] on the enum `WorkspaceHistoryAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
ALTER TYPE "WorkspaceHistoryAction" RENAME VALUE 'TAG_ADDED' TO 'ITEM_TAG_ASSIGNED';
ALTER TYPE "WorkspaceHistoryAction" RENAME VALUE 'TAG_REMOVED' TO 'ITEM_TAG_UNASSIGNED';
ALTER TYPE "WorkspaceHistoryAction" ADD VALUE 'TAG_CREATED';
ALTER TYPE "WorkspaceHistoryAction" ADD VALUE 'TAG_UPDATED';
ALTER TYPE "WorkspaceHistoryAction" ADD VALUE 'TAG_DELETED';
COMMIT;
