ALTER TABLE "currency_rate" DROP COLUMN "from_currency";

ALTER TABLE "currency_rate" DROP COLUMN "to_currency";

ALTER TABLE "currency_rate" RENAME COLUMN "new_from_currency" TO "from_currency";

ALTER TABLE "currency_rate" RENAME COLUMN "new_to_currency" TO "to_currency";
