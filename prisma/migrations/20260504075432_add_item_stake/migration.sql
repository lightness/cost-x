
-- CreateTable
CREATE TABLE "item_stake" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "workspace_member_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PK_item_stake_id" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_item_stake_item_id_workspace_member_id" ON "item_stake"("item_id", "workspace_member_id");

-- AddForeignKey
ALTER TABLE "item_stake" ADD CONSTRAINT "FK_item_stake_item_id_item_id" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_stake" ADD CONSTRAINT "FK_item_stake_workspace_member_id_workspace_member_id" FOREIGN KEY ("workspace_member_id") REFERENCES "workspace_member"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
