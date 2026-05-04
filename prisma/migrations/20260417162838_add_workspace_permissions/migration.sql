-- CreateEnum
CREATE TYPE "WorkspacePermission" AS ENUM ('CREATE_ITEM', 'UPDATE_ITEM', 'DELETE_ITEM', 'CREATE_PAYMENT', 'UPDATE_PAYMENT', 'DELETE_PAYMENT', 'CREATE_TAG', 'UPDATE_TAG', 'DELETE_TAG', 'ASSIGN_TAG', 'UNASSIGN_TAG', 'MERGE_ITEMS', 'EXTRACT_ITEM', 'CREATE_WORKSPACE_INVITE', 'CANCEL_WORKSPACE_INVITE');

-- CreateTable
CREATE TABLE "user_workspace_permission" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "permission" "WorkspacePermission" NOT NULL,
    "granted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_user_workspace_permission_id" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_user_workspace_permission_user_id_workspace_id_permission" ON "user_workspace_permission"("user_id", "workspace_id", "permission");

-- AddForeignKey
ALTER TABLE "user_workspace_permission" ADD CONSTRAINT "FK_user_workspace_permission_user_id_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_workspace_permission" ADD CONSTRAINT "FK_user_workspace_permission_workspace_id_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
