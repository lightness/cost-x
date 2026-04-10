# Workspace-History Module

Provides a read-only audit log of all mutations performed within a workspace.

---

## Table of Contents

- [Overview](#overview)
- [Object Type: `WorkspaceHistory`](#object-type-workspacehistory)
- [Actions](#actions)
- [Where It Appears](#where-it-appears)

---

## Overview

Workspace history is recorded automatically whenever a mutation occurs on a workspace's data (items, payments, tags, etc.). There are no mutations exposed by this module — history entries are created as a side effect of other operations and are read-only from the API perspective.

---

## Object Type: `WorkspaceHistory`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Entry ID |
| `createdAt` | `DateIso!` | When the action occurred |
| `workspaceId` | `Int!` | The workspace this entry belongs to |
| `actorId` | `Int!` | ID of the user who performed the action |
| `action` | `WorkspaceHistoryAction!` | The type of action (see [Actions](#actions)) |
| `oldValue` | `JSON` | State before the change (null for create operations) |
| `newValue` | `JSON` | State after the change (null for delete operations) |
| `actor` | `User!` | Resolved: the user who performed the action |
| `message` | `String!` | Resolved: human-readable description of the action |
| `changes` | `JSON` | Resolved: field-level diff (`{ field: { oldValue, newValue } }`) |

### `changes` field

For update actions, `changes` provides a structured diff of what changed:

```json
{
  "title": { "oldValue": "Groceries", "newValue": "Food & Groceries" }
}
```

Fields included in the diff vary by action type:
- Items: `title`
- Payments: `title`, `cost`, `currency`, `date`
- Tags: `title`, `color`
- Workspaces: `title`, `defaultCurrency`
- Item-tag assignments: `itemId`, `tagId`
- Merges / extracts: titles of the items involved

---

## Actions

| Action | Triggered by |
|---|---|
| `WORKSPACE_CREATED` | `createWorkspace` |
| `WORKSPACE_UPDATED` | `updateWorkspace` |
| `WORKSPACE_DELETED` | `deleteWorkspace` |
| `ITEM_CREATED` | `createItem` |
| `ITEM_UPDATED` | `updateItem` |
| `ITEM_DELETED` | `deleteItem` |
| `ITEM_MERGED` | `mergeItems` |
| `ITEM_EXTRACTED` | `extractAsItem` |
| `PAYMENT_CREATED` | `createPayment` |
| `PAYMENT_UPDATED` | `updatePayment` |
| `PAYMENT_DELETED` | `deletePayment` |
| `TAG_CREATED` | `createTag` |
| `TAG_UPDATED` | `updateTag` |
| `TAG_DELETED` | `deleteTag` |
| `ITEM_TAG_ASSIGNED` | `assignTag` |
| `ITEM_TAG_UNASSIGNED` | `unassignTag` |

---

## Where It Appears

History is accessed via `Workspace.history`. Entries are ordered most-recent first.

```graphql
query {
  me {
    workspaces {
      title
      history {
        createdAt
        action
        message
        actor { name }
        changes
      }
    }
  }
}
```

An optional filter is accepted:

| Argument | Type | Description |
|---|---|---|
| `workspaceHistoryFilter` | `WorkspaceHistoryFilter` | Filter by `id` to fetch a specific entry |
