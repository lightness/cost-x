import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterItemChangeTitle1759499337297 implements MigrationInterface {
    name = 'AlterItemChangeTitle1759499337297'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "item" ADD "title" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "item" ADD "title" character varying(100) NOT NULL`);
    }

}
