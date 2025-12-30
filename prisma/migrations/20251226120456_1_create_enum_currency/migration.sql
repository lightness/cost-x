-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BYN', 'USD', 'EUR');

-- AlterTable
ALTER TABLE "currency_rate" ADD COLUMN     "new_from_currency" "Currency",
ADD COLUMN     "new_to_currency" "Currency";

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "new_currency" "Currency";
