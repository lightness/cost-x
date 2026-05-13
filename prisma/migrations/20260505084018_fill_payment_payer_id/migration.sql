-- fill payer_id for all payments
UPDATE payment
SET payer_id = source.owner_member_id
FROM (
       SELECT wm.id as owner_member_id, i.id as item_id
       FROM workspace_member wm
              INNER JOIN workspace w on wm.workspace_id = w.id
              INNER JOIN item i on i.workspace_id = w.id
       WHERE wm.user_id = w.owner_id
     ) as source
WHERE source.item_id = payment.item_id;
