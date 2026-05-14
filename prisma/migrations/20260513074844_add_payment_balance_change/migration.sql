-- CreateEnum
CREATE TYPE "BalanceCurrencyMode" AS ENUM ('PAYMENT_CURRENCY', 'DEFAULT_CURRENCY');

-- AlterTable
ALTER TABLE "workspace" ADD COLUMN     "balance_currency_mode" "BalanceCurrencyMode" NOT NULL DEFAULT 'PAYMENT_CURRENCY';

-- CreateTable
CREATE TABLE "payment_balance_change" (
    "id" SERIAL NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "workspace_member_id" INTEGER NOT NULL,
    "value" DECIMAL NOT NULL,
    "currency" "Currency" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_payment_balance_change_id" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_payment_balance_change_payment_id_workspace_member_id" ON "payment_balance_change"("payment_id", "workspace_member_id");

-- AddForeignKey
ALTER TABLE "payment_balance_change" ADD CONSTRAINT "FK_payment_balance_change_payment_id_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_balance_change" ADD CONSTRAINT "FK_pbc_workspace_member_id_workspace_member_id" FOREIGN KEY ("workspace_member_id") REFERENCES "workspace_member"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
