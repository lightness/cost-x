import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPaymentAddTitle1759396699981 implements MigrationInterface {
    name = 'AlterPaymentAddTitle1759396699981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" ADD "title" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "title"`);
    }

}
