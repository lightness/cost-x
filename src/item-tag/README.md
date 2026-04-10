# Item-Tag Module

Manages tag assignments on items (many-to-many relationship between items and tags).

---

## Table of Contents

- [Object Type: `ItemTag`](#object-type-itemtag)
- [Mutations](#mutations)
  - [`assignTag`](#assigntag)
  - [`unassignTag`](#unassigntag)

---

## Object Type: `ItemTag`

Represents a single tag-to-item assignment.

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Assignment ID |
| `createdAt` | `DateIso!` | When the tag was assigned |
| `updatedAt` | `DateIso!` | Last update timestamp |
| `itemId` | `Int!` | The item |
| `tagId` | `Int!` | The tag |
| `item` | `Item` | Resolved: the item |
| `tag` | `Tag` | Resolved: the tag |

---

## Mutations

### `assignTag`

Assigns a tag to an item.

```graphql
mutation {
  assignTag(dto: { itemId: 10, tagId: 3 }) {
    id
    item { title }
    tag { title color }
  }
}
```

**Auth**: required · **Role**: `USER` (must own both the item and the tag) or `ADMIN`

**Input**:

| Field | Type | Description |
|---|---|---|
| `itemId` | `Int!` | Item to assign the tag to |
| `tagId` | `Int!` | Tag to assign |

**Behavior**:
- The item and tag must belong to the same workspace — cross-workspace assignment is rejected
- Fails if the tag is already assigned to the item
- Records an `ITEM_TAG_ASSIGNED` entry in the workspace audit history

---

### `unassignTag`

Removes a tag from an item.

```graphql
mutation {
  unassignTag(dto: { itemId: 10, tagId: 3 })
}
```

**Auth**: required · **Role**: `USER` (must own both the item and the tag) or `ADMIN`

**Input**:

| Field | Type | Description |
|---|---|---|
| `itemId` | `Int!` | Item to remove the tag from |
| `tagId` | `Int!` | Tag to remove |

Returns `Boolean` (`true` on success).

**Behavior**:
- The item and tag must belong to the same workspace
- Fails if the tag is not currently assigned to the item
- Records an `ITEM_TAG_UNASSIGNED` entry in the workspace audit history
