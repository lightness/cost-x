-- CreateEnum
CREATE TYPE "Permission" AS ENUM (
  'USER_LIST',
  'USER_READ',
  'USER_UPDATE',
  'USER_DELETE',
  'USER_BAN',
  'USER_UNBAN',
  'WORKSPACE_READ',
  'WORKSPACE_UPDATE',
  'WORKSPACE_DELETE',
  'ITEM_READ',
  'ITEM_CREATE',
  'ITEM_UPDATE',
  'ITEM_DELETE',
  'TAG_CREATE',
  'TAG_UPDATE',
  'TAG_DELETE',
  'PAYMENT_READ',
  'PAYMENT_CREATE',
  'PAYMENT_UPDATE',
  'PAYMENT_DELETE',
  'CONTACT_DELETE',
  'INVITE_CREATE',
  'INVITE_ACCEPT',
  'INVITE_REJECT',
  'USER_BLOCK_CREATE',
  'USER_BLOCK_DELETE',
  'ITEM_TAG_MANAGE'
);

-- CreateTable
CREATE TABLE "user_permission" (
  "user_id" INTEGER NOT NULL,
  "permission" "Permission" NOT NULL,
  CONSTRAINT "user_permission_pkey" PRIMARY KEY ("user_id", "permission")
);

-- AddForeignKey
ALTER TABLE "user_permission" ADD CONSTRAINT "FK_user_permission_user_id_user_id"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- DataMigration: grant all permissions to existing ADMIN users
INSERT INTO "user_permission" ("user_id", "permission")
SELECT u.id, p.permission
FROM "user" u
CROSS JOIN (
  VALUES
    ('USER_LIST'::"Permission"),
    ('USER_READ'::"Permission"),
    ('USER_UPDATE'::"Permission"),
    ('USER_DELETE'::"Permission"),
    ('USER_BAN'::"Permission"),
    ('USER_UNBAN'::"Permission"),
    ('WORKSPACE_READ'::"Permission"),
    ('WORKSPACE_UPDATE'::"Permission"),
    ('WORKSPACE_DELETE'::"Permission"),
    ('ITEM_READ'::"Permission"),
    ('ITEM_CREATE'::"Permission"),
    ('ITEM_UPDATE'::"Permission"),
    ('ITEM_DELETE'::"Permission"),
    ('TAG_CREATE'::"Permission"),
    ('TAG_UPDATE'::"Permission"),
    ('TAG_DELETE'::"Permission"),
    ('PAYMENT_READ'::"Permission"),
    ('PAYMENT_CREATE'::"Permission"),
    ('PAYMENT_UPDATE'::"Permission"),
    ('PAYMENT_DELETE'::"Permission"),
    ('CONTACT_DELETE'::"Permission"),
    ('INVITE_CREATE'::"Permission"),
    ('INVITE_ACCEPT'::"Permission"),
    ('INVITE_REJECT'::"Permission"),
    ('USER_BLOCK_CREATE'::"Permission"),
    ('USER_BLOCK_DELETE'::"Permission"),
    ('ITEM_TAG_MANAGE'::"Permission")
) AS p(permission)
WHERE u.role = 'ADMIN'::"UserRole";

-- AlterTable: drop role column
ALTER TABLE "user" DROP COLUMN "role";

-- DropEnum
DROP TYPE "UserRole";
