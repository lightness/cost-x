# Tag Module

Manages labels (tags) that can be assigned to items within a workspace.

---

## Table of Contents

- [Object Type: `Tag`](#object-type-tag)
- [Queries](#queries)
  - [`tag`](#tagid-int)
  - [`tags`](#tagsworkspaceid-int)
- [Mutations](#mutations)
  - [`createTag`](#createtagworkspaceid-int)
  - [`updateTag`](#updatetagid-int)
  - [`deleteTag`](#deletetagid-int)

---

## Object Type: `Tag`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Tag ID |
| `createdAt` | `DateIso!` | Creation timestamp |
| `updatedAt` | `DateIso!` | Last update timestamp |
| `title` | `String!` | Tag label |
| `color` | `String` | Hex color code (e.g. `#FF5733`), optional |
| `workspaceId` | `Int!` | Owning workspace |
| `workspace` | `Workspace!` | Resolved: the owning workspace |
| `items` | `[Item!]!` | Resolved: items with this tag (accepts `ItemsFilter`, `PaymentsFilter`) |
| `itemsAggregation` | `ItemsAggregation` | Resolved: aggregated metrics for items with this tag |

---

## Queries

### `tag(id: Int!)`

Returns a single tag by ID.

```graphql
query {
  tag(id: 3) {
    id
    title
    color
    workspaceId
  }
}
```

**Auth**: required · **Role**: `USER` (own tags only) or `ADMIN`

---

### `tags(workspaceId: Int!)`

Returns all tags in a workspace, with optional title filtering.

```graphql
query {
  tags(workspaceId: 3, dto: { title: "work" }) {
    id
    title
    color
  }
}
```

**Auth**: required · **Role**: `USER` (own workspace only) or `ADMIN`

**Arguments**:

| Argument | Type | Description |
|---|---|---|
| `workspaceId` | `Int!` | Workspace to list tags from |
| `dto` | `TagsFilter` | Optional filter |

### `TagsFilter`

| Field | Type | Description |
|---|---|---|
| `title` | `String` | Case-insensitive partial match on tag title |

---

## Mutations

### `createTag(workspaceId: Int!)`

Creates a new tag in a workspace.

```graphql
mutation {
  createTag(workspaceId: 3, dto: { title: "Recurring", color: "#4A90D9" }) {
    id
    title
    color
  }
}
```

**Auth**: required · **Role**: `USER` (own workspace only) or `ADMIN`

**Input**:

| Field | Type | Rules |
|---|---|---|
| `title` | `String!` | Tag label |
| `color` | `String` | Optional hex color code (e.g. `#FF5733`) |

**Behavior**:
- Records a `TAG_CREATED` entry in the workspace audit history

---

### `updateTag(id: Int!)`

Updates a tag's title or color.

```graphql
mutation {
  updateTag(id: 3, dto: { title: "Recurring Bills", color: "#2ECC71" }) {
    id
    title
    color
  }
}
```

**Auth**: required · **Role**: `USER` (own tags only) or `ADMIN`

**Input**:

| Field | Type | Rules |
|---|---|---|
| `title` | `String!` | New tag label |
| `color` | `String` | New hex color (optional) |

**Behavior**:
- Fails with `400` if the tag does not exist
- Records a `TAG_UPDATED` entry in the workspace audit history

---

### `deleteTag(id: Int!)`

Permanently deletes a tag. All assignments of this tag to items are also removed.

```graphql
mutation {
  deleteTag(id: 3)
}
```

**Auth**: required · **Role**: `USER` (own tags only) or `ADMIN`

Returns `Boolean` (`true` on success).

**Behavior**:
- Fails with `400` if the tag does not exist
- Records a `TAG_DELETED` entry in the workspace audit history
