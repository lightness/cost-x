import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPaymentChangeItemIdFk1762938841880 implements MigrationInterface {
    name = 'AlterPaymentChangeItemIdFk1762938841880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_payment_item_id_item_id"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_payment_item_id_item_id" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_payment_item_id_item_id"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_payment_item_id_item_id" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
