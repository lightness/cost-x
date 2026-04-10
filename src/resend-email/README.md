# Resend Email Module

Re-sends verification or password reset emails when the original message was lost or expired.

---

## Table of Contents

- [Overview](#overview)
- [Mutations](#mutations)
  - [`resendConfirmEmail`](#resendconfirmemail)
  - [`resendForgotPasswordEmail`](#resendforgotpasswordemail)

---

## Overview

Both mutations are public (no authentication required) and are deliberately privacy-preserving — they always return `{ success: true }` regardless of whether the user exists or is already confirmed, to avoid leaking account information.

---

## Mutations

### `resendConfirmEmail`

Re-sends the email confirmation link for an unverified account.

```graphql
mutation {
  resendConfirmEmail(dto: { userId: 42 }) {
    success
  }
}
```

**Auth**: none (public)

**Input**:

| Field | Type | Description |
|---|---|---|
| `userId` | `Int!` | ID of the user to resend confirmation for |

**Response**:

| Field | Type |
|---|---|
| `success` | `Boolean!` |

**Behavior**:
- Always returns `{ success: true }` — errors are swallowed silently
- Does nothing if the user does not exist
- Does nothing if the email is already confirmed
- Otherwise re-triggers the confirmation flow (see [Confirm Email module](../confirm-email/README.md))

---

### `resendForgotPasswordEmail`

Re-sends the password reset email using the existing reset code (does not generate a new one).

```graphql
mutation {
  resendForgotPasswordEmail(dto: { email: "alice@example.com" }) {
    success
  }
}
```

**Auth**: none (public)

**Input**:

| Field | Type | Rules |
|---|---|---|
| `email` | `String!` | Valid email format |

**Response**:

| Field | Type |
|---|---|
| `success` | `Boolean!` |

**Behavior**:
- Looks up the user by email
- Reuses the existing reset code rather than generating a new one — use `forgotPassword` first to initiate the flow (see [Reset Password module](../reset-password/README.md))
- Fails with `400` if the user does not exist, email is not verified, or the account is banned
