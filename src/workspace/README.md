# Workspace Module

Manages workspaces — the top-level containers for expense tracking.

---

## Table of Contents

- [Object Type: `Workspace`](#object-type-workspace)
- [Mutations](#mutations)
  - [`createWorkspace`](#createworkspace)
  - [`updateWorkspace`](#updateworkspaceid-int)
  - [`deleteWorkspace`](#deleteworkspaceid-int)

---

## Object Type: `Workspace`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Workspace ID |
| `createdAt` | `DateIso!` | Creation timestamp |
| `updatedAt` | `DateIso!` | Last update timestamp |
| `title` | `String!` | Workspace name |
| `ownerId` | `Int!` | User who owns this workspace |
| `defaultCurrency` | `Currency!` | Default currency for cost display (`USD`, `EUR`, `BYN`) |
| `items` | `[Item!]!` | Resolved: items in this workspace — see [Item](../item/README.md) (accepts `ItemsFilter`, `PaymentsFilter`) |
| `tags` | `[Tag!]!` | Resolved: tags in this workspace — see [Tag](../tag/README.md) (accepts `TagsFilter`) |
| `itemsAggregation` | `ItemsAggregation` | Resolved: aggregated metrics across items — see [Items-Aggregation](../items-aggregation/README.md) (accepts `ItemsFilter`, `PaymentsFilter`) |
| `history` | `[WorkspaceHistory!]!` | Resolved: audit log — see [Workspace-History](../workspace-history/README.md) |

Workspaces are accessed via the `User.workspaces` field — there is no standalone `workspace` query. Use `me { workspaces { ... } }` or `user(id: ...) { workspaces { ... } }` (see [User](../user/README.md)).

---

## Mutations

### `createWorkspace`

Creates a new workspace owned by the current user.

```graphql
mutation {
  createWorkspace(dto: { title: "Home Budget", defaultCurrency: USD }) {
    id
    title
    defaultCurrency
  }
}
```

**Auth**: required · **Role**: any authenticated user

**Input**:

| Field | Type | Description |
|---|---|---|
| `title` | `String!` | Workspace name |
| `defaultCurrency` | `Currency!` | Default currency (`USD`, `EUR`, `BYN`) |

**Behavior**:
- The current user becomes the workspace owner (`ownerId`)
- Records a `WORKSPACE_CREATED` entry in the [audit history](../workspace-history/README.md)

---

### `updateWorkspace(id: Int!)`

Updates a workspace's title or default currency.

```graphql
mutation {
  updateWorkspace(id: 3, dto: { title: "Family Budget", defaultCurrency: EUR }) {
    id
    title
    defaultCurrency
  }
}
```

**Auth**: required · **Role**: `USER` (own workspace only) or `ADMIN`

**Input**:

| Field | Type | Description |
|---|---|---|
| `title` | `String!` | New workspace name |
| `defaultCurrency` | `Currency!` | New default currency |

**Behavior**:
- Records a `WORKSPACE_UPDATED` entry in the [audit history](../workspace-history/README.md) (old and new values captured)

---

### `deleteWorkspace(id: Int!)`

Permanently deletes a workspace and all its contents.

```graphql
mutation {
  deleteWorkspace(id: 3) {
    id
    title
  }
}
```

**Auth**: required · **Role**: `USER` (own workspace only) or `ADMIN`

Returns the deleted `Workspace` object.

**Behavior**:
- Deletes the workspace and cascades to all items, payments, and tags within it
- Records a `WORKSPACE_DELETED` entry in the [audit history](../workspace-history/README.md) before deletion
