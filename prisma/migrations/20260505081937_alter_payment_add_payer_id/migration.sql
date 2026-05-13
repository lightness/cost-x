-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "payer_id" INTEGER;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "FK_payment_payer_id_workspace_member_id" FOREIGN KEY ("payer_id") REFERENCES "workspace_member"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
