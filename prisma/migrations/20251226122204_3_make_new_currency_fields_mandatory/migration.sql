/*
  Warnings:

  - Made the column `new_from_currency` on table `currency_rate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `new_to_currency` on table `currency_rate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `new_currency` on table `payment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "currency_rate" ALTER COLUMN "new_from_currency" SET NOT NULL,
ALTER COLUMN "new_to_currency" SET NOT NULL;

-- AlterTable
ALTER TABLE "payment" ALTER COLUMN "new_currency" SET NOT NULL;
