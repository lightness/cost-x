# User Module

Manages user accounts — registration, profile updates, and administration.

---

## Table of Contents

- [Authentication](#authentication)
- [Object Type: User](#object-type-user)
- [Queries](#queries)
  - [`me`](#me)
  - [`user`](#userid-int)
  - [`users`](#users)
- [Mutations](#mutations)
  - [`createUser`](#createuser--registration)
  - [`updateUser`](#updateuserid-int--update-profile)
  - [`deleteUser`](#deleteuserid-int--delete-account)
  - [`banUser`](#banuserid-int--ban-account)
  - [`unbanUser`](#unbanuserid-int--unban-account)
- [Error Codes](#error-codes)

---

## Authentication

Most operations require a valid JWT session (set via cookie after login). Operations that require **admin role** are noted explicitly. The `createUser` mutation is the only public endpoint.

---

## Object Type: `User`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Unique user identifier |
| `name` | `String!` | Display name |
| `email` | `String!` | Email address |
| `role` | `UserRole!` | `ADMIN` or `USER` |
| `isBanned` | `Boolean!` | Whether the account is banned |
| `isEmailVerified` | `Boolean!` | `true` when email has been confirmed |
| `createdAt` | `DateIso!` | Account creation timestamp (ISO 8601) |
| `updatedAt` | `DateIso!` | Last update timestamp (ISO 8601) |
| `workspaces` | `[Workspace!]!` | Workspaces the user belongs to (see [Workspace module](../workspace/README.md)) |
| `contacts` | `[Contact!]!` | User's contact list |
| `blockedUsers` | `[User!]!` | Users blocked by this user |
| `incomingInvites` | `[Invite!]!` | Received invites (defaults to `PENDING`) |
| `outgoingInvites` | `[Invite!]!` | Sent invites (defaults to `PENDING`) |

Relational fields (`workspaces`, `contacts`, etc.) are resolved on demand and are batched automatically to avoid N+1 queries.

---

## Queries

### `me`

Returns the currently authenticated user.

```graphql
query {
  me {
    id
    name
    email
    role
    isEmailVerified
  }
}
```

**Auth**: required · **Role**: any

---

### `user(id: Int!)`

Returns a single user by ID.

```graphql
query {
  user(id: 42) {
    id
    name
    email
  }
}
```

**Auth**: required · **Role**: `USER` can only fetch their own profile; `ADMIN` can fetch any user

---

### `users`

Returns all registered users.

```graphql
query {
  users {
    id
    name
    email
    isBanned
    role
  }
}
```

**Auth**: required · **Role**: `ADMIN` only

---

## Mutations

### `createUser` — Registration

Creates a new user account. No authentication required.

```graphql
mutation {
  createUser(dto: {
    name: "Alice"
    email: "alice@example.com"
    password: "Str0ng!Pass"
  }) {
    id
    name
    email
  }
}
```

**Auth**: none (public)

**Input**:

| Field | Type | Rules |
|---|---|---|
| `name` | `String!` | Non-empty |
| `email` | `String!` | Valid email format |
| `password` | `String!` | Min 6 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 symbol |

**Behavior**:
- Email is stored in lowercase
- Password is hashed before storage (never stored in plain text)
- An email confirmation message is sent automatically — the account is created immediately but `isEmailVerified` will be `false` until confirmed
- Fails with `USER_ALREADY_EXISTS` if the email is already registered

---

### `updateUser(id: Int!)` — Update Profile

Updates a user's name, email, or password. All fields are optional.

```graphql
mutation {
  updateUser(id: 42, dto: {
    name: "Alice Smith"
    email: "alice.smith@example.com"
  }) {
    id
    name
    email
    isEmailVerified
  }
}
```

**Auth**: required · **Role**: `USER` can only update their own profile; `ADMIN` can update any user

**Input**:

| Field | Type | Notes |
|---|---|---|
| `name` | `String` | Optional |
| `email` | `String` | Optional; changing email resets email verification |
| `password` | `String` | Optional; new password is hashed on save |

**Behavior**:
- When email is changed, a new confirmation message is sent and `isEmailVerified` resets to `false`
- Password is re-hashed if provided

---

### `deleteUser(id: Int!)` — Delete Account

Permanently deletes a user. This action is irreversible.

```graphql
mutation {
  deleteUser(id: 42)
}
```

**Auth**: required · **Role**: `ADMIN` only

Returns `Boolean` (`true` on success).

---

### `banUser(id: Int!)` — Ban Account

Bans a user, preventing them from accessing the system.

```graphql
mutation {
  banUser(id: 42) {
    id
    isBanned
  }
}
```

**Auth**: required · **Role**: `ADMIN` only

Fails if the user is already banned.

---

### `unbanUser(id: Int!)` — Unban Account

Lifts a ban from a user.

```graphql
mutation {
  unbanUser(id: 42) {
    id
    isBanned
  }
}
```

**Auth**: required · **Role**: `ADMIN` only

Fails if the user is not currently banned.

---

## Error Codes

| Code | HTTP | Trigger |
|---|---|---|
| `USER_ALREADY_EXISTS` | 400 | `createUser` called with an already-registered email |
