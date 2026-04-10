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
| `WORKSPACE_CREATED` | [`createWorkspace`](../workspace/README.md#createworkspace) |
| `WORKSPACE_UPDATED` | [`updateWorkspace`](../workspace/README.md#updateworkspaceid-int) |
| `WORKSPACE_DELETED` | [`deleteWorkspace`](../workspace/README.md#deleteworkspaceid-int) |
| `ITEM_CREATED` | [`createItem`](../item/README.md#createitemworkspaceid-int) |
| `ITEM_UPDATED` | [`updateItem`](../item/README.md#updateitemid-int) |
| `ITEM_DELETED` | [`deleteItem`](../item/README.md#deleteitemid-int) |
| `ITEM_MERGED` | [`mergeItems`](../item-merge/README.md#mergeitems) |
| `ITEM_EXTRACTED` | [`extractAsItem`](../item-extract/README.md#extractasitem) |
| `PAYMENT_CREATED` | [`createPayment`](../payment/README.md#createpaymentitemid-int) |
| `PAYMENT_UPDATED` | [`updatePayment`](../payment/README.md#updatepaymentpaymentid-int) |
| `PAYMENT_DELETED` | [`deletePayment`](../payment/README.md#deletepaymentpaymentid-int) |
| `TAG_CREATED` | [`createTag`](../tag/README.md#createtagworkspaceid-int) |
| `TAG_UPDATED` | [`updateTag`](../tag/README.md#updatetagid-int) |
| `TAG_DELETED` | [`deleteTag`](../tag/README.md#deletetagid-int) |
| `ITEM_TAG_ASSIGNED` | [`assignTag`](../item-tag/README.md#assigntag) |
| `ITEM_TAG_UNASSIGNED` | [`unassignTag`](../item-tag/README.md#unassigntag) |

---

## Where It Appears

History is accessed via [`Workspace.history`](../workspace/README.md). Entries are ordered most-recent first.

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
