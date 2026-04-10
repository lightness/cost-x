# Item-Merge Module

Merges two items by consolidating all payments from one item into another, then deleting the source.

---

## Table of Contents

- [Overview](#overview)
- [Mutations](#mutations)
  - [`mergeItems`](#mergeitems)

---

## Overview

`mergeItems` combines two [items](../item/README.md) into one. All [payments](../payment/README.md) from the **merging item** are copied into the **host item**, and the merging item is deleted. Tags are not transferred — the host item keeps its own tags and the merging item's tags are removed.

Both items must belong to the same workspace.

---

## Mutations

### `mergeItems`

Merges one item into another.

```graphql
mutation {
  mergeItems(dto: { hostItemId: 5, mergingItemId: 12 }) {
    id
    title
    payments {
      id
      title
      cost
      currency
      date
    }
  }
}
```

**Auth**: required · **Role**: `USER` (must own both items) or `ADMIN`

**Input**:

| Field | Type | Description |
|---|---|---|
| `hostItemId` | `Int!` | Item that will receive all payments and survive |
| `mergingItemId` | `Int!` | Item whose payments will be moved; this item is deleted |

**Returns**: the host item after the merge is complete.

**Behavior**:
- Both items must belong to the same workspace — cross-workspace merges are rejected
- All payments from the merging item are copied into the host item
  - If a payment has no title, the merging item's title is used as the payment title
- All tags are removed from the merging item before it is deleted
- The merging item is permanently deleted
- Records an `ITEM_MERGED` entry in the [workspace audit history](../workspace-history/README.md)
