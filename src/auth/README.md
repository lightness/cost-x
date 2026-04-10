# Auth Module

Handles session lifecycle — login, token refresh, and logout. Uses JWT access/refresh token pairs delivered via HTTP-only cookies.

---

## Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [`POST /auth/login`](#post-authlogin)
  - [`POST /auth/refresh-token`](#post-authrefresh-token)
  - [`POST /auth/logout`](#post-authlogout)
- [Error Codes](#error-codes)

---

## Overview

Auth is implemented as a **REST controller** (not GraphQL). All endpoints are under the `/auth` prefix.

Token strategy:
- **Access token** — short-lived JWT, sent in the `Authorization: Bearer <token>` header on subsequent requests
- **Refresh token** — longer-lived JWT, stored automatically in an `httpOnly`, `Secure`, `SameSite=strict` cookie; not accessible from JavaScript

Tokens can be invalidated server-side via a Redis blacklist.

---

## Endpoints

### `POST /auth/login`

Authenticates a user and issues a new token pair.

**Auth**: none (public)

**Request body** (`application/json`):

| Field | Type | Description |
|---|---|---|
| `email` | `String!` | Registered email address |
| `password` | `String!` | Account password |

**Response** (`200 OK`):

| Field | Type | Description |
|---|---|---|
| `accessToken` | `String` | JWT to use in `Authorization` header |
| `refreshToken` | `String?` | JWT (also set as cookie automatically) |

**Behavior**:
- Email lookup is case-sensitive; use the exact email used at registration
- Verifies the password against the stored bcrypt hash
- Requires email to be confirmed (`isEmailVerified: true`) — unverified accounts cannot log in (see [Confirm Email](../confirm-email/README.md))
- Requires account to not be banned (see [User](../user/README.md) — `banUser` / `unbanUser`)
- Sets the refresh token as an `httpOnly` cookie automatically — no manual handling needed

**Errors**:

| Code | Trigger |
|---|---|
| `INVALID_CREDENTIALS` | User not found or password mismatch |
| `EMAIL_IS_NOT_VERIFIED` | Account exists but email not confirmed yet |
| `USER_BANNED` | Account is banned |

---

### `POST /auth/refresh-token`

Issues a new access/refresh token pair using a valid refresh token cookie.

**Auth**: none — but requires the `refreshToken_refresh-token` cookie set by login

**Response** (`200 OK`): same shape as login

**Behavior**:
- Reads the refresh token from the cookie set during login (no manual token handling needed)
- Validates the refresh token's signature and expiration
- Invalidates the previous token pair (old tokens cannot be reused)
- Issues a new token pair and updates the cookie

**Errors**:

| Code | Trigger |
|---|---|
| `INVALID_REFRESH_TOKEN` | Cookie missing, token invalid, or token expired |
| `UNKNOWN_USER` | User referenced in token no longer exists |
| `EMAIL_IS_NOT_VERIFIED` | Email was unverified after token was issued |
| `USER_BANNED` | Account was banned after token was issued |

---

### `POST /auth/logout`

Invalidates the current session.

**Auth**: required — `Authorization: Bearer <accessToken>` header

**Response** (`200 OK`):

| Field | Type |
|---|---|
| `success` | `Boolean` |

**Behavior**:
- Adds both the access and refresh tokens to the Redis blacklist — they cannot be used again
- Clears the refresh token cookie
- Subsequent requests using the same access token will be rejected

**Errors**:

| Code | Trigger |
|---|---|
| `USER_NOT_AUTHORIZED` | Access token missing or invalid |
| `INVALID_REFRESH_TOKEN` | Refresh token cookie missing or invalid |

---

## Error Codes

| Code | HTTP | Description |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `EMAIL_IS_NOT_VERIFIED` | 401 | Email confirmation pending |
| `USER_BANNED` | 401 | Account is banned |
| `USER_NOT_AUTHORIZED` | 401 | Missing or invalid access token |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token missing, invalid, or expired |
| `UNKNOWN_USER` | 401 | User from token payload no longer exists |
