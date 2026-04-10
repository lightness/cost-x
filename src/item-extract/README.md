# Item-Extract Module

Splits selected payments out of an existing item into a new item.

---

## Table of Contents

- [Overview](#overview)
- [Mutations](#mutations)
  - [`extractAsItem`](#extractasitem)
- [Error Codes](#error-codes)

---

## Overview

`extractAsItem` is useful when an item has grown to contain payments that belong to a separate category. You pick a subset of payments and give the new item a title — those payments are moved and all tags from the source item are copied to the new one.

The source item is preserved with at least one payment remaining — extracting all payments from an item is not allowed.

---

## Mutations

### `extractAsItem`

Moves a subset of payments into a newly created item.

```graphql
mutation {
  extractAsItem(dto: {
    itemId: 10
    paymentIds: [101, 102, 103]
    title: "Business Travel"
  }) {
    id
    title
    payments {
      id
      cost
      currency
      date
    }
    tags {
      id
      title
    }
  }
}
```

**Auth**: required · **Role**: `USER` (must own the source item) or `ADMIN`

**Input**:

| Field | Type | Rules |
|---|---|---|
| `itemId` | `Int!` | Source item to extract payments from |
| `paymentIds` | `[Int!]!` | IDs of payments to move (must be non-empty) |
| `title` | `String!` | Title for the new item |

**Returns**: the newly created item with the extracted payments.

**Behavior**:
- `paymentIds` must not be empty
- All specified payment IDs must belong to the source item
- Must leave at least one payment in the source item — specifying all payments is rejected
- All tags from the source item are copied to the new item
- Records an `ITEM_EXTRACTED` entry in the workspace audit history

---

## Error Codes

| Code | HTTP | Trigger |
|---|---|---|
| `EXTRACT_PAYMENTS_EMPTY` | 400 | `paymentIds` array is empty |
| `EXTRACT_ALL_PAYMENTS` | 400 | `paymentIds` contains every payment in the source item |
| `PAYMENT_NOT_BELONG_TO_ITEM` | 400 | One or more payment IDs do not belong to the source item |
