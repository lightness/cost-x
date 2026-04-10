# Confirm Email Module

Handles email address verification after account creation or email change.

---

## Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [`GET /confirm-email`](#get-confirm-email)
- [Flow](#flow)

---

## Overview

Email confirmation is a **REST endpoint** (not GraphQL). It is triggered automatically by the system when:
- A new user account is created via [`createUser`](../user/README.md#createuser--registration)
- A user changes their email via [`updateUser`](../user/README.md#updateuserid-int--update-profile)

The system supports two confirmation strategies configured at the application level:
- **Manual** — sends a confirmation link to the user's email; the user must click it to verify
- **Auto** — immediately marks the email as confirmed without sending any message (useful for development/testing environments)

---

## Endpoints

### `GET /confirm-email`

Confirms a user's email address using a one-time token.

**Auth**: none (public)

**Query parameters**:

| Parameter | Type | Description |
|---|---|---|
| `token` | `String!` | JWT confirmation token received in the email link |

**Response** (`200 OK`):

```json
{ "message": "User activated" }
```

**Behavior**:
- Verifies the JWT token's signature and expiration
- Matches the token's internal code against the stored confirmation code for the user
- On success, marks the email as confirmed (`isEmailVerified` becomes `true`) and invalidates the token so it cannot be reused
- Fails with `400` if the token is invalid, expired, already used, or does not match the stored code

---

## Flow

```
createUser / updateUser
        │
        ▼
System generates one-time code + JWT token
        │
        ▼
  [Manual strategy]         [Auto strategy]
Email sent to user     →    Email confirmed immediately
with /confirm-email link
        │
        ▼
User clicks link → GET /confirm-email?token=<JWT>
        │
        ▼
isEmailVerified = true
```

Until confirmed, the user **cannot log in** — the [Auth module](../auth/README.md) rejects unverified accounts with `EMAIL_IS_NOT_VERIFIED`.
