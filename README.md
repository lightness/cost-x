# Cost-X API

A multi-user expense tracking backend with workspace collaboration, category management, and historical exchange rates.

**Stack**: NestJS · TypeScript · Apollo GraphQL · Prisma · PostgreSQL · Redis

---

## Table of Contents

- [Getting Started](#getting-started)
- [API Overview](#api-overview)
  - [Transport](#transport)
  - [Authentication](#authentication)
  - [Roles](#roles)
  - [Currencies](#currencies)
  - [Scalars](#scalars)
- [Modules](#modules)
- [Common Patterns](#common-patterns)
  - [Error Shape](#error-shape)
  - [Pagination / Filtering](#pagination--filtering)
  - [Aggregations](#aggregations)
  - [Audit History](#audit-history)

---

## Getting Started

**Prerequisites**: Docker, Node.js

```bash
# 1. Start Postgres (port 9992) and Redis (port 6380)
cd docker && docker compose up -d

# 2. Install dependencies and set up the database
npm i
npm run prisma:client:generate
npm run prisma:migration:up

# 3. Start the dev server (port 9998)
npm run start:dev
```

GraphQL playground: `http://localhost:9998/graphql`

---

## API Overview

### Transport

The API is primarily **GraphQL** (code-first, Apollo). A small number of session and verification flows are exposed as **REST** endpoints.

| Protocol | Base URL |
|---|---|
| GraphQL | `http://localhost:9998/graphql` |
| REST | `http://localhost:9998` |

---

### Authentication

Most GraphQL operations require a valid session. Authentication is cookie-based:

1. Call `POST /auth/login` with email and password
2. Receive an `accessToken` in the response body and a `refreshToken` in an `httpOnly` cookie
3. Pass the access token on subsequent GraphQL requests: `Authorization: Bearer <accessToken>`
4. When the access token expires, call `POST /auth/refresh-token` to get a new pair

See the [Auth module](src/auth/README.md) for the full endpoint reference.

---

### Roles

| Role | Access |
|---|---|
| `USER` | Can access and modify their own data only |
| `ADMIN` | Full access to all resources |

Operations that are `ADMIN`-only are noted in each module's documentation.

---

### Currencies

Three currencies are supported throughout the API:

| Code | Description |
|---|---|
| `BYN` | Belarusian Ruble (base currency for rate calculations) |
| `USD` | US Dollar |
| `EUR` | Euro |

---

### Scalars

Custom GraphQL scalars used across the schema:

| Scalar | Format | Example |
|---|---|---|
| `Date` | `YYYY-MM-DD` | `"2024-03-15"` |
| `DateIso` | ISO 8601 | `"2024-03-15T10:30:00.000Z"` |
| `Decimal` | Numeric string | `"49.99"` |
| `JSON` | Any JSON value | `{ "key": "value" }` |

---

## Modules

### Auth & Identity

| Module | Description | Docs |
|---|---|---|
| `auth` | Login, token refresh, logout | [→](src/auth/README.md) |
| `user` | Registration, profile management, admin controls | [→](src/user/README.md) |
| `confirm-email` | Email address verification flow | [→](src/confirm-email/README.md) |
| `resend-email` | Re-send verification or password reset emails | [→](src/resend-email/README.md) |
| `reset-password` | Forgot password / reset password flow | [→](src/reset-password/README.md) |

### Social

| Module | Description | Docs |
|---|---|---|
| `contact` | Contacts, invites (by ID or email), and user blocking | [→](src/contact/README.md) |

### Expense Tracking

| Module | Description | Docs |
|---|---|---|
| `workspace` | Top-level expense containers | [→](src/workspace/README.md) |
| `item` | Expense categories within a workspace | [→](src/item/README.md) |
| `payment` | Individual expense records | [→](src/payment/README.md) |
| `tag` | Labels for items | [→](src/tag/README.md) |
| `item-tag` | Assign / unassign tags on items | [→](src/item-tag/README.md) |
| `item-extract` | Split payments from one item into a new item | [→](src/item-extract/README.md) |
| `item-merge` | Consolidate two items into one | [→](src/item-merge/README.md) |

### Aggregations & Analytics

| Module | Description | Docs |
|---|---|---|
| `items-aggregation` | Item counts and rollup metrics across a workspace or tag | [→](src/items-aggregation/README.md) |
| `payments-aggregation` | Payment totals by currency, date range, and default currency | [→](src/payments-aggregation/README.md) |
| `currency-rate` | Historical exchange rates (NBRB, cached) | [→](src/currency-rate/README.md) |

### Audit

| Module | Description | Docs |
|---|---|---|
| `workspace-history` | Read-only audit log of all workspace mutations | [→](src/workspace-history/README.md) |

---

## Common Patterns

### Error Shape

All application errors follow a consistent GraphQL error shape:

```json
{
  "errors": [
    {
      "message": "Human-readable description",
      "extensions": {
        "code": "APPLICATION_ERROR_CODE",
        "status": 400
      }
    }
  ]
}
```

Each module's documentation lists the error codes it can produce.

---

### Pagination / Filtering

The API does not use cursor or offset pagination — queries return full result sets. Filtering is available on most list operations via `ItemsFilter` and `PaymentsFilter` arguments:

```graphql
items(workspaceId: 3, itemsFilter: { tagIds: [1], title: "food" }, paymentsFilter: { dateFrom: "2024-01-01" }) { ... }
```

---

### Aggregations

Aggregated metrics are available at multiple levels of the data hierarchy without extra queries:

```
Workspace
  └── itemsAggregation
        ├── count
        └── paymentsAggregation
              ├── count
              ├── costByCurrency { USD EUR BYN }
              ├── costInDefaultCurrency
              ├── firstPaymentDate
              └── lastPaymentDate
```

The same structure is available on `Tag` and on individual `Item` nodes. All aggregations accept `PaymentsFilter` to scope the date range.

---

### Audit History

Every mutation on workspace data (items, payments, tags, etc.) automatically creates a history entry. History is accessible via `Workspace.history` and includes a human-readable `message`, a structured `changes` diff, and the `actor` who performed the action.

See [workspace-history](src/workspace-history/README.md) for the full field reference.
