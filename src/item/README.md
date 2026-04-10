# Item Module

Manages expense categories (items) within a workspace.

---

## Table of Contents

- [Object Type: `Item`](#object-type-item)
- [Queries](#queries)
  - [`item`](#itemid-int)
  - [`items`](#itemsworkspaceid-int)
- [Mutations](#mutations)
  - [`createItem`](#createitemworkspaceid-int)
  - [`updateItem`](#updateitemid-int)
  - [`deleteItem`](#deleteitemid-int)
- [Filters](#filters)
- [Error Codes](#error-codes)

---

## Object Type: `Item`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Item ID |
| `createdAt` | `DateIso!` | Creation timestamp |
| `updatedAt` | `DateIso!` | Last update timestamp |
| `title` | `String!` | Item name / category label |
| `workspaceId` | `Int!` | Owning workspace |
| `workspace` | `Workspace` | Resolved: the owning workspace |
| `payments` | `[Payment!]` | Resolved: payments under this item (accepts `PaymentsFilter`) |
| `paymentsAggregation` | `PaymentsAggregation` | Resolved: aggregated cost metrics for this item |
| `tags` | `[Tag!]` | Resolved: tags assigned to this item |

---

## Queries

### `item(id: Int!)`

Returns a single item by ID.

```graphql
query {
  item(id: 10) {
    id
    title
    workspaceId
    tags { id title }
    payments { id cost currency date }
  }
}
```

**Auth**: required · **Role**: `USER` (own items only) or `ADMIN`

---

### `items(workspaceId: Int!)`

Returns all items in a workspace, with optional filtering.

```graphql
query {
  items(
    workspaceId: 3
    itemsFilter: { tagIds: [1, 2], title: "grocery" }
    paymentsFilter: { dateFrom: "2024-01-01", dateTo: "2024-12-31" }
  ) {
    id
    title
    paymentsAggregation {
      count
      costByCurrency { USD EUR BYN }
    }
  }
}
```

**Auth**: required · **Role**: `USER` (own workspace only) or `ADMIN`

**Arguments**:

| Argument | Type | Description |
|---|---|---|
| `workspaceId` | `Int!` | Workspace to list items from |
| `itemsFilter` | `ItemsFilter` | Optional — filter by tags and/or title |
| `paymentsFilter` | `PaymentsFilter` | Optional — passed through to `payments` and `paymentsAggregation` field resolvers |

---

## Mutations

### `createItem(workspaceId: Int!)`

Creates a new item in a workspace.

```graphql
mutation {
  createItem(workspaceId: 3, dto: { title: "Groceries" }) {
    id
    title
  }
}
```

**Auth**: required · **Role**: `USER` (own workspace only) or `ADMIN`

**Input**:

| Field | Type | Description |
|---|---|---|
| `title` | `String!` | Item name |

**Behavior**:
- Creates the item and records a `ITEM_CREATED` entry in the workspace audit history

---

### `updateItem(id: Int!)`

Updates an item's title.

```graphql
mutation {
  updateItem(id: 10, dto: { title: "Food & Groceries" }) {
    id
    title
  }
}
```

**Auth**: required · **Role**: `USER` (own items only) or `ADMIN`

**Input**:

| Field | Type | Description |
|---|---|---|
| `title` | `String!` | New title |

**Behavior**:
- Fails with `ITEM_NOT_FOUND` if the item does not exist
- Records an `ITEM_UPDATED` entry in the workspace audit history

---

### `deleteItem(id: Int!)`

Permanently deletes an item and all its payments.

```graphql
mutation {
  deleteItem(id: 10)
}
```

**Auth**: required · **Role**: `USER` (own items only) or `ADMIN`

Returns `Boolean` (`true` on success).

**Behavior**:
- Fails with `ITEM_NOT_FOUND` if the item does not exist
- Records an `ITEM_DELETED` entry in the workspace audit history

---

## Filters

### `ItemsFilter`

| Field | Type | Description |
|---|---|---|
| `tagIds` | `[Int!]` | Return only items that have all of the specified tags |
| `title` | `String` | Case-insensitive partial match on item title |

### `PaymentsFilter`

| Field | Type | Description |
|---|---|---|
| `dateFrom` | `Date` | Include payments on or after this date (YYYY-MM-DD) |
| `dateTo` | `Date` | Include payments on or before this date (YYYY-MM-DD) |

---

## Error Codes

| Code | HTTP | Trigger |
|---|---|---|
| `ITEM_NOT_FOUND` | 400 | Item ID not found during update or delete |
