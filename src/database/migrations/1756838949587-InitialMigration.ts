import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1756838949587 implements MigrationInterface {
    name = 'InitialMigration1756838949587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "payment" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "cost" numeric NOT NULL, "currency" character varying(3) NOT NULL, "date" TIMESTAMP NOT NULL, "item_id" integer NOT NULL, CONSTRAINT "PK_payment_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tag" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(100) NOT NULL, CONSTRAINT "PK_tag_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "item" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(100) NOT NULL, CONSTRAINT "PK_item_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "item_tag" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "item_id" integer NOT NULL, "tag_id" integer NOT NULL, CONSTRAINT "PK_item_tag_id" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_payment_item_id_item_id" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_tag" ADD CONSTRAINT "FK_item_tag_item_id_item_id" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_tag" ADD CONSTRAINT "FK_item_tag_tag_id_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_tag" DROP CONSTRAINT "FK_item_tag_tag_id_tag_id"`);
        await queryRunner.query(`ALTER TABLE "item_tag" DROP CONSTRAINT "FK_item_tag_item_id_item_id"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_payment_item_id_item_id"`);

        await queryRunner.query(`DROP TABLE "item_tag"`);
        await queryRunner.query(`DROP TABLE "item"`);
        await queryRunner.query(`DROP TABLE "tag"`);
        await queryRunner.query(`DROP TABLE "payment"`);
    }

}
