/*
  Warnings:

  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "FK_contact_invitee_id_user_id";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "FK_contact_inviter_id_user_id";

-- DropTable
DROP TABLE "Contact";

-- CreateTable
CREATE TABLE "contact" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviter_id" INTEGER NOT NULL,
    "invitee_id" INTEGER NOT NULL,
    "status" "ContactStatus" NOT NULL,

    CONSTRAINT "PK_contact_id" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_contact_inviter_id_invitee_id" ON "contact"("inviter_id", "invitee_id");

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "FK_contact_inviter_id_user_id" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "FK_contact_invitee_id_user_id" FOREIGN KEY ("invitee_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
