# Payments-Aggregation Module

Provides aggregated financial metrics across one or more items. Exposed as a resolved field — not directly queryable.

---

## Table of Contents

- [Overview](#overview)
- [Object Type: `PaymentsAggregation`](#object-type-paymentsaggregation)
- [Object Type: `CostByCurrency`](#object-type-costbycurrency)
- [Where It Appears](#where-it-appears)

---

## Overview

`PaymentsAggregation` is returned by parent resolvers (items, workspaces, tags) and aggregates payment metrics for a given set of items. It is not directly queryable — request it as a field on `Item`, `ItemsAggregation`, or similar types.

All fields are optional and resolved lazily — only the fields you request are computed.

---

## Object Type: `PaymentsAggregation`

| Field | Type | Description |
|---|---|---|
| `count` | `Int` | Total number of payments |
| `costInDefaultCurrency` | `Decimal` | Total cost converted to the workspace's default currency |
| `costByCurrency` | `CostByCurrency` | Total cost broken down by currency |
| `firstPaymentDate` | `Date` | Date of the earliest payment (YYYY-MM-DD) |
| `lastPaymentDate` | `Date` | Date of the most recent payment (YYYY-MM-DD) |

All values respect the `PaymentsFilter` (date range) applied by the parent query.

---

## Object Type: `CostByCurrency`

| Field | Type | Description |
|---|---|---|
| `BYN` | `Decimal!` | Sum of all BYN payments |
| `USD` | `Decimal!` | Sum of all USD payments |
| `EUR` | `Decimal!` | Sum of all EUR payments |

---

## Where It Appears

### On a single `Item`

```graphql
query {
  item(id: 10) {
    paymentsAggregation {
      count
      costByCurrency { USD EUR BYN }
      firstPaymentDate
      lastPaymentDate
    }
  }
}
```

### On `ItemsAggregation` (workspace or tag level)

```graphql
query {
  items(workspaceId: 3) {
    paymentsAggregation {
      count
      costInDefaultCurrency
    }
  }
}
```

See [Items-Aggregation module](../items-aggregation/README.md) for workspace/tag-level aggregations.
