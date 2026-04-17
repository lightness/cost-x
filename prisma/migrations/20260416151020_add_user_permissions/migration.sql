-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('CREATE_WORKSPACE', 'UPDATE_PROFILE', 'CREATE_CONTACT_INVITE', 'ACCEPT_CONTACT_INVITE', 'REJECT_CONTACT_INVITE', 'BLOCK_USER', 'UNBLOCK_USER', 'DELETE_CONTACT', 'ACCEPT_WORKSPACE_INVITE', 'REJECT_WORKSPACE_INVITE');

-- CreateTable
CREATE TABLE "user_permission" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "permission" "Permission" NOT NULL,
    "granted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_user_permission_id" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_user_permission_user_id_permission" ON "user_permission"("user_id", "permission");

-- AddForeignKey
ALTER TABLE "user_permission" ADD CONSTRAINT "FK_user_permission_user_id_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
