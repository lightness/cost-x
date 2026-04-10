# Items-Aggregation Module

Provides aggregated metrics across items in a workspace or tag, with optional filtering.

---

## Table of Contents

- [Overview](#overview)
- [Object Type: `ItemsAggregation`](#object-type-itemsaggregation)
- [Query: `itemsAggregation`](#query-itemsaggregation)
- [Where It Also Appears](#where-it-also-appears)

---

## Overview

`ItemsAggregation` answers questions like "how many items match these filters?" or "what is the total spend across all items in this workspace?". It can be queried directly or accessed as a field on `Workspace` or `Tag`.

---

## Object Type: `ItemsAggregation`

| Field | Type | Description |
|---|---|---|
| `count` | `Int` | Number of items matching the current filters |
| `paymentsAggregation` | `PaymentsAggregation` | Aggregated payment metrics across the matched items |

`paymentsAggregation` accepts an optional `PaymentsFilter` argument to further narrow the payments included in the aggregation independently of the items filter.

See [Payments-Aggregation module](../payments-aggregation/README.md) for the full `PaymentsAggregation` field reference.

---

## Query: `itemsAggregation`

Returns aggregated metrics for items matching the given filters. No auth required.

```graphql
query {
  itemsAggregation(
    itemsFilter: { tagIds: [1, 2], title: "grocery" }
    paymentsFilter: { dateFrom: "2024-01-01", dateTo: "2024-12-31" }
  ) {
    count
    paymentsAggregation {
      count
      costByCurrency { USD EUR BYN }
      costInDefaultCurrency
      firstPaymentDate
      lastPaymentDate
    }
  }
}
```

**Auth**: none

**Arguments**:

| Argument | Type | Description |
|---|---|---|
| `itemsFilter` | `ItemsFilter` | Filter items by tag IDs and/or title |
| `paymentsFilter` | `PaymentsFilter` | Filter payments by date range |

### `ItemsFilter`

| Field | Type | Description |
|---|---|---|
| `tagIds` | `[Int!]` | Return items that have any of the specified tags |
| `title` | `String` | Case-insensitive partial match on item title |

### `PaymentsFilter`

| Field | Type | Description |
|---|---|---|
| `dateFrom` | `Date` | Include payments on or after this date (YYYY-MM-DD) |
| `dateTo` | `Date` | Include payments on or before this date (YYYY-MM-DD) |

---

## Where It Also Appears

### On `Workspace`

```graphql
query {
  me {
    workspaces {
      title
      itemsAggregation(
        itemsFilter: { title: "food" }
        paymentsFilter: { dateFrom: "2024-01-01" }
      ) {
        count
        paymentsAggregation {
          costInDefaultCurrency
        }
      }
    }
  }
}
```

### On `Tag`

```graphql
query {
  tag(id: 3) {
    title
    itemsAggregation {
      count
      paymentsAggregation {
        costByCurrency { USD EUR BYN }
      }
    }
  }
}
```
