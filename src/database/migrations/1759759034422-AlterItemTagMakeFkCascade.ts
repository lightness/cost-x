import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterItemTagMakeFkCascade1759759034422 implements MigrationInterface {
    name = 'AlterItemTagMakeFkCascade1759759034422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_tag" DROP CONSTRAINT "FK_item_tag_item_id_item_id"`);
        await queryRunner.query(`ALTER TABLE "item_tag" DROP CONSTRAINT "FK_item_tag_tag_id_tag_id"`);
        await queryRunner.query(`ALTER TABLE "item_tag" ADD CONSTRAINT "FK_item_tag_item_id_item_id" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_tag" ADD CONSTRAINT "FK_item_tag_tag_id_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_tag" DROP CONSTRAINT "FK_item_tag_tag_id_tag_id"`);
        await queryRunner.query(`ALTER TABLE "item_tag" DROP CONSTRAINT "FK_item_tag_item_id_item_id"`);
        await queryRunner.query(`ALTER TABLE "item_tag" ADD CONSTRAINT "FK_item_tag_tag_id_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_tag" ADD CONSTRAINT "FK_item_tag_item_id_item_id" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
