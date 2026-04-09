ALTER TYPE "Permission" ADD VALUE 'WORKSPACE_CREATE';

-- DataMigration: grant WORKSPACE_CREATE to all users who already have WORKSPACE_UPDATE (i.e. former admins)
INSERT INTO "user_permission" ("user_id", "permission")
SELECT "user_id", 'WORKSPACE_CREATE'::"Permission"
FROM "user_permission"
WHERE "permission" = 'WORKSPACE_UPDATE'
ON CONFLICT DO NOTHING;
