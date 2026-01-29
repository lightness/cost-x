/*
  Warnings:

  - Added the required column `default_currency` to the `workspace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workspace" ADD COLUMN     "default_currency" "Currency" NOT NULL;
