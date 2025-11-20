import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTagAddColor1763383730423 implements MigrationInterface {
    name = 'AlterTagAddColor1763383730423'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tag" ADD "color" character varying(6) NOT NULL DEFAULT 'FFFFFF'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tag" DROP COLUMN "color"`);
    }

}
