# Contact Module

Manages the social graph between users — contact connections, invites, and blocking.

---

## Table of Contents

- [Overview](#overview)
- [Object Types](#object-types)
  - [`Contact`](#contact)
  - [`Invite`](#invite)
  - [`UserBlock`](#userblock)
- [Mutations](#mutations)
  - [`createInvite`](#createinvite)
  - [`createInviteByEmail`](#createinvitebyemail)
  - [`acceptInvite`](#acceptinvite)
  - [`rejectInvite`](#rejectinvite)
  - [`rejectInviteAndBlockUser`](#rejectinviteandblockuser)
  - [`deleteContact`](#deletecontact)
  - [`blockUser`](#blockuser)
  - [`unblockUser`](#unblockuser)
- [REST Endpoints](#rest-endpoints)
  - [`GET /email-invite/accept`](#get-email-inviteaccept)
  - [`GET /email-invite/reject`](#get-email-invitereject)
- [Error Codes](#error-codes)

---

## Overview

A **contact** is a bidirectional relationship established when one user sends an invite and the other accepts. The full flow is:

```
User A sends invite → User B accepts → both users become contacts
```

Contacts can be broken by either party via `deleteContact`. Users can also block others, which prevents new invites and automatically removes any existing contact.

The module also supports **email invites** — inviting users who are not yet registered. A temporary "ghost" account is created for them; once they click the link and set a password, they become full users and the contact is established.

---

## Object Types

### `Contact`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Contact ID |
| `createdAt` | `DateIso!` | When the contact was created |
| `sourceUserId` | `Int!` | User who initiated the invite |
| `targetUserId` | `Int!` | User who accepted the invite |
| `inviteId` | `Int!` | Originating invite |
| `removedAt` | `DateIso` | When the contact was removed (null if active) |
| `removedByUserId` | `Int` | Who removed the contact |
| `sourceUser` | `User!` | Resolved: the initiating user |
| `targetUser` | `User!` | Resolved: the accepting user |
| `invite` | `Invite!` | Resolved: the originating invite |

---

### `Invite`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Invite ID |
| `inviterId` | `Int!` | User who sent the invite |
| `inviteeId` | `Int!` | User who received the invite |
| `status` | `InviteStatus!` | `PENDING`, `ACCEPTED`, or `REJECTED` |
| `createdAt` | `DateIso!` | When the invite was sent |
| `reactedAt` | `DateIso` | When the invite was accepted or rejected |
| `inviter` | `User!` | Resolved: the sender |
| `invitee` | `User!` | Resolved: the recipient |

---

### `UserBlock`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Block ID |
| `createdAt` | `DateIso!` | When the block was created |
| `blockerId` | `Int!` | User who issued the block |
| `blockedId` | `Int!` | User who was blocked |
| `removedAt` | `DateIso` | When the block was lifted (null if active) |
| `removedByUserId` | `Int` | Who lifted the block |
| `blocker` | `User!` | Resolved: the blocking user |
| `blocked` | `User!` | Resolved: the blocked user |

---

## Mutations

### `createInvite`

Sends a contact invite from one user to another by user ID.

```graphql
mutation {
  createInvite(dto: { inviterUserId: 1, inviteeUserId: 2 }) {
    id
    status
    inviter { name }
    invitee { name }
  }
}
```

**Auth**: required · **Role**: `USER` (own `inviterUserId` only) or `ADMIN`

**Input**:

| Field | Type | Description |
|---|---|---|
| `inviterUserId` | `Int!` | ID of the user sending the invite |
| `inviteeUserId` | `Int!` | ID of the user to invite |

**Behavior**:
- Fails if an invite already exists in either direction between these users
- Fails if a contact already exists between them
- Fails if either user has blocked the other

---

### `createInviteByEmail`

Sends a contact invite to an email address. Works for both registered and unregistered users.

```graphql
mutation {
  createInviteByEmail(dto: { inviterUserId: 1, inviteeEmail: "bob@example.com" }) {
    id
    status
  }
}
```

**Auth**: required · **Role**: `USER` (own `inviterUserId` only) or `ADMIN`

**Input**:

| Field | Type | Rules |
|---|---|---|
| `inviterUserId` | `Int!` | ID of the inviting user |
| `inviteeEmail` | `String!` | Valid email address |

**Behavior**:
- Email is normalized (lowercased, `+` tags stripped) before processing
- If the email belongs to an existing user, behaves like `createInvite` with all the same blocking/duplicate checks
- If the email is unregistered, a temporary account is created and an invitation email is sent — the recipient must click the link and set a password to complete the flow (see [`GET /email-invite/accept`](#get-email-inviteaccept))
- Duplicate email invites from the same inviter are prevented

---

### `acceptInvite`

Accepts a pending invite, establishing the contact between both users.

```graphql
mutation {
  acceptInvite(inviteId: 5) {
    id
    status
    inviter { name }
    invitee { name }
  }
}
```

**Auth**: required · **Role**: `USER` (must be the invitee) or `ADMIN`

**Behavior**:
- Invite must be in `PENDING` status
- Checks that no blocking relationship exists at the time of acceptance
- Creates a bidirectional contact record (visible in both users' contact lists)
- Sets invite status to `ACCEPTED`

---

### `rejectInvite`

Rejects a pending invite without blocking the sender.

```graphql
mutation {
  rejectInvite(inviteId: 5) {
    id
    status
  }
}
```

**Auth**: required · **Role**: `USER` (must be the invitee) or `ADMIN`

**Behavior**:
- Invite must be in `PENDING` status
- Sets invite status to `REJECTED`; no contact is created

---

### `rejectInviteAndBlockUser`

Rejects a pending invite and blocks the sender in one operation.

```graphql
mutation {
  rejectInviteAndBlockUser(inviteId: 5) {
    id
    status
  }
}
```

**Auth**: required · **Role**: `USER` (must be the invitee) or `ADMIN`

**Behavior**:
- Rejects the invite (same as `rejectInvite`)
- Creates a block against the inviter
- If any active contact existed between these users, it is removed

---

### `deleteContact`

Removes an active contact.

```graphql
mutation {
  deleteContact(contactId: 10) {
    id
    removedAt
  }
}
```

**Auth**: required · **Role**: `USER` (must be one of the two parties in the contact) or `ADMIN`

**Behavior**:
- Fails if the contact is already removed
- Marks both sides of the bidirectional contact as removed

---

### `blockUser`

Blocks another user.

```graphql
mutation {
  blockUser(dto: { blockerId: 1, blockedId: 3 }) {
    id
    createdAt
    blocker { name }
    blocked { name }
  }
}
```

**Auth**: required · **Role**: `USER` (own `blockerId` only) or `ADMIN`

**Input**:

| Field | Type | Description |
|---|---|---|
| `blockerId` | `Int!` | ID of the user issuing the block |
| `blockedId` | `Int!` | ID of the user being blocked |

**Behavior**:
- Cannot block yourself
- Fails if the block already exists
- Automatically removes any active contact between the two users

---

### `unblockUser`

Lifts a block on another user.

```graphql
mutation {
  unblockUser(dto: { blockerId: 1, blockedId: 3 }) {
    id
    removedAt
  }
}
```

**Auth**: required · **Role**: `USER` (own `blockerId` only) or `ADMIN`

**Input**:

| Field | Type | Description |
|---|---|---|
| `blockerId` | `Int!` | ID of the user lifting the block |
| `blockedId` | `Int!` | ID of the user being unblocked |

**Behavior**:
- Fails if no active block exists between these users

---

## REST Endpoints

These endpoints are used exclusively by the email invite flow and are called via links in emails, not directly by API consumers.

### `GET /email-invite/accept`

Accepts an email invite for a user arriving from the invitation link.

**Auth**: none (public)

**Query parameters**:

| Parameter | Type | Description |
|---|---|---|
| `token` | `String!` | JWT token from the invitation email |

**Response**:

```json
{ "resetPasswordToken": "<token>" }
```

**Behavior**:
- Verifies the token and the associated invite
- If the invitee's email belongs to an existing account: links the contact to the existing user and removes the temporary account
- If the email has no existing account: converts the temporary account to a real user
- Returns a `resetPasswordToken` — the client should immediately redirect the user to set their password via [`resetPassword`](../reset-password/README.md)

---

### `GET /email-invite/reject`

Rejects an email invite via the invitation link.

**Auth**: none (public)

**Query parameters**:

| Parameter | Type | Description |
|---|---|---|
| `token` | `String!` | JWT token from the invitation email |

**Response**: `204 No Content`

---

## Error Codes

| Code | HTTP | Trigger |
|---|---|---|
| `CONTACT_ALREADY_EXISTS` | 400 | Contact already exists between these users |
| `CONTACT_ALREADY_REMOVED` | 400 | Attempting to delete an already-removed contact |
| `CONTACT_NOT_FOUND` | 400 | Contact ID not found |
| `INVITE_NOT_FOUND` | 400 | Invite ID not found |
| `IMPROPER_INVITE_STATUS` | 400 | Invite is not in the required status (e.g., not `PENDING`) |
| `INVITER_ALREADY_SEND_INVITE` | 400 | Invite already sent in this direction |
| `INVITEE_ALREADY_SEND_INVITE` | 400 | Invite already exists in the reverse direction |
| `INVITER_BLOCKED_INVITEE` | 400 | Inviter has blocked the invitee |
| `INVITEE_BLOCKED_INVITER` | 400 | Invitee has blocked the inviter |
| `SELF_BLOCK_FORBIDDEN` | 400 | Attempted to block yourself |
| `USER_IS_ALREADY_BLOCKED` | 400 | Block already exists |
| `USER_IS_NOT_BLOCKED` | 400 | Attempted to unblock a user who is not blocked |
| `BLOCKED_USER_NOT_FOUND` | 400 | Target user for block not found |
| `EMAIL_INVITE_TOKEN_INVALID` | 400 | Token is missing, malformed, or expired |
| `EMAIL_INVITE_NO_LONGER_VALID` | 400 | Invite was already accepted or rejected |
