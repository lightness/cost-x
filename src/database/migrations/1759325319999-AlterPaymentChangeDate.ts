import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPaymentChangeDate1759325319999 implements MigrationInterface {
    name = 'AlterPaymentChangeDate1759325319999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "date"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "date" date NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "date"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "date" TIMESTAMP NOT NULL`);
    }

}
