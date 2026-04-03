# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cost-X** is a NestJS GraphQL API backend for expense tracking with multi-user workspace collaboration.

**Stack**: NestJS 11 · TypeScript · Apollo GraphQL · Prisma ORM · PostgreSQL · Redis · Biome

## Setup

```bash
# 1. Start dependencies (Postgres on :9992, Redis on :6380)
cd docker && docker compose up -d

# 2. Install, generate client, apply migrations
npm i
npm run prisma:client:generate
npm run prisma:migration:up

# 3. Run dev server (port 9998)
npm run start:dev
```

## Common Commands

```bash
npm run start:dev                    # Dev server with hot reload
npm test                             # Run all E2E tests (Jest, verbose, serial)

npm run lint:fix                     # Biome lint + format in-place

npm run prisma:migration:create      # Create a new migration (set migration_name env var)
npm run prisma:migration:up          # Apply pending migrations
npm run prisma:migration:reset       # Reset database (destructive)
npm run prisma:client:generate       # Regenerate Prisma client after schema changes
npm run prisma:client:generate:force # Force regen (removes ./generated/ first)
npm run prisma:studio                # Open Prisma Studio GUI
```

## Architecture

### Module Structure

NestJS modules are organized by domain under `src/`. Each domain typically has:
- `*.module.ts` — wires providers/imports
- `*.service.ts` — business logic + Prisma calls
- `resolver/*.resolver.ts` — GraphQL resolvers (queries/mutations)
- `entity/*.entity.ts` — GraphQL object types (`@ObjectType`)
- `dto/*.dto.ts` — input types (`@InputType`)
- `loader/*.loader.ts` — DataLoaders (prevent N+1 queries)

### Key Domains

| Module | Responsibility |
|--------|---------------|
| `auth` | JWT login, guards, cookie/token lifecycle |
| `access` | RBAC rule engine — `@Access()` decorator enforces resource-level rules |
| `workspace` | Top-level cost-tracking container; owns items |
| `item` | Expense category within a workspace |
| `payment` | Individual expense record (cost, date, currency) |
| `tag` / `item-tag` | Labels on items (many-to-many) |
| `contact` | Invite → accept flow creates contacts; includes user blocking |
| `workspace-history` | Audit log for all workspace mutations |
| `currency-rate` | Historical exchange rates (BYN/USD/EUR) |
| `items-aggregation` / `payments-aggregation` | Aggregated cost/payment summaries |
| `item-merge` | Merges multiple items into one |
| `prisma` | Shared `PrismaService` — import this for all DB access |
| `redis` | Shared `RedisService` — used for token invalidation and caching |

### Auth & Access Control

- `AuthGuard` validates JWT from cookie and attaches user to request context
- `AccessGuard` runs after `AuthGuard`; evaluates `@Access()` rules via `AccessModule`
- Access rules are defined per-resolver and can check ownership, workspace membership, or admin role
- Tokens are short-lived (180 min access / 181 min refresh); expired tokens are tracked in Redis

### GraphQL

- Schema is **code-first** (auto-generated to `src/graphql/schema.gql`)
- Custom scalars: `Date` (YYYY-MM-DD), `DateIso` (ISO 8601), `Decimal`, `JSON`
- DataLoaders are provided per-request via context to batch DB queries

### Cross-Cutting

- `DbExceptionInterceptor` — maps Prisma errors to GraphQL errors
- `TransactionInterceptor` — wraps mutations in Prisma transactions
- `ApplicationExceptionFilter` — centralizes error response formatting
- `EventEmitterModule` — used for decoupled side effects (e.g., history recording)

## Testing

Tests live in `test/` and are E2E integration tests that hit a real database (`.env.test`). Factory services in `test/factory/` create test fixtures (`UserFactoryService`, `InviteFactoryService`, etc.).

Run a single test file:
```bash
npx jest test/contact.e2e.spec.ts --verbose
```

## Code Style

Biome is the linter/formatter. Config in `biome.json`: 2-space indent, single quotes, 100-char line width.
