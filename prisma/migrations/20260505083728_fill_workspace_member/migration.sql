-- insert workspace members for all workspace owners
INSERT INTO workspace_member (workspace_id, user_id, invite_id, joined_at, removed_at, removed_by_user_id)
SELECT id, owner_id, null, created_at, null, null
FROM workspace
ON CONFLICT (workspace_id, user_id) WHERE removed_at IS NULL DO NOTHING;