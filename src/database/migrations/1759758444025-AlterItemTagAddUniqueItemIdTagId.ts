import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterItemTagAddUniqueItemIdTagId1759758444025 implements MigrationInterface {
    name = 'AlterItemTagAddUniqueItemIdTagId1759758444025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_tag" ADD CONSTRAINT "UQ_item_tag_item_id_tag_id" UNIQUE ("item_id", "tag_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_tag" DROP CONSTRAINT "UQ_item_tag_item_id_tag_id"`);
    }

}
