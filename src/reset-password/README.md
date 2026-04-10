# Reset Password Module

Handles the forgot-password / reset-password flow via email-based one-time tokens.

---

## Table of Contents

- [Overview](#overview)
- [Mutations](#mutations)
  - [`forgotPassword`](#forgotpassword)
  - [`resetPassword`](#resetpassword)
- [Flow](#flow)
- [Error Codes](#error-codes)

---

## Overview

Password reset is a two-step process: request a reset link via `forgotPassword`, then submit the new password via `resetPassword` using the token from the email.

Both mutations are public — no authentication required.

---

## Mutations

### `forgotPassword`

Initiates a password reset by sending a reset link to the user's email.

```graphql
mutation {
  forgotPassword(dto: { email: "alice@example.com" })
}
```

**Auth**: none (public)

**Input**:

| Field | Type | Rules |
|---|---|---|
| `email` | `String!` | Valid email format |

**Returns**: `Boolean` (`true` on success)

**Behavior**:
- Looks up the user by email
- Requires the account to have a confirmed email (`isEmailVerified: true`)
- Requires the account to not be banned
- Generates a one-time reset token and sends it to the user's email as a link
- The token is single-use — once `resetPassword` is called, it is invalidated

**Errors**:

| Trigger | HTTP |
|---|---|
| User not found | 400 |
| Email not verified | 400 |
| Account is banned | 400 |

---

### `resetPassword`

Sets a new password using the token received by email.

```graphql
mutation {
  resetPassword(dto: {
    token: "<JWT from email link>"
    password: "NewStr0ng!Pass"
  })
}
```

**Auth**: none (public)

**Input**:

| Field | Type | Rules |
|---|---|---|
| `token` | `String!` | Must be a valid JWT (from the reset email link) |
| `password` | `String!` | New password (plain text — hashed before storage) |

**Returns**: `Boolean` (`true` on success)

**Behavior**:
- Verifies the JWT token's signature and expiration
- Validates the token's internal code against the stored code for the user — ensures the token has not already been used
- Hashes the new password and saves it
- Invalidates the token so it cannot be reused

**Errors**:

| Trigger | HTTP |
|---|---|
| Token invalid or expired | 400 |
| User not found | 400 |
| Token already used | 400 |

---

## Flow

```
forgotPassword(email)
      │
      ▼
System generates one-time token → email sent with reset link
      │
      ▼
User clicks link, submits new password
      │
      ▼
resetPassword(token, newPassword)
      │
      ▼
Password updated, token invalidated
```

To re-send the reset email without generating a new token, use [`resendForgotPasswordEmail`](../resend-email/README.md).

---

## Error Codes

All errors from this module return HTTP `400`. No custom application error codes — errors surface as standard `BadRequestException`.
