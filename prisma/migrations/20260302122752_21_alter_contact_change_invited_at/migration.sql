/*
  Warnings:

  - Made the column `invitedAt` on table `contact` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "contact" ALTER COLUMN "invitedAt" SET NOT NULL;
