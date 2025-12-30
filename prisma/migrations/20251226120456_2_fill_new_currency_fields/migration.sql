UPDATE "currency_rate"
SET new_from_currency = from_currency::"Currency",
    new_to_currency = to_currency::"Currency"
WHERE 1=1;

UPDATE "payment"
SET new_currency = currency::"Currency"
WHERE 1=1;