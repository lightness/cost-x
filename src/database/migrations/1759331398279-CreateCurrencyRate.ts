import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCurrencyRate1759331398279 implements MigrationInterface {
    name = 'CreateCurrencyRate1759331398279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "currency_rate" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "from_currency" character varying(3) NOT NULL, "to_currency" character varying(3) NOT NULL, "date" date NOT NULL, "rate" numeric NOT NULL, CONSTRAINT "PK_currency_rate_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "currency_rate"`);
    }

}
