# Implementation Plan: Payment Balance Changes

## Overview

Introduce a `PaymentBalanceChange` DB table that stores per-member balance change for every
payment, driven by the item's effective stakes. A new workspace column `balanceCurrencyMode`
controls whether values are in the payment's own currency or converted to the workspace default.

---

## Step 1 — Prisma schema changes (migration)

**New enum** `BalanceCurrencyMode`:

```
PAYMENT_CURRENCY   (default — store value in payment.currency)
DEFAULT_CURRENCY   (convert to workspace.defaultCurrency)
```

**Add to `Workspace` model:**

```
balanceCurrencyMode  BalanceCurrencyMode  @default(PAYMENT_CURRENCY)
```

**New model** `PaymentBalanceChange`:

```
id                 Int      @id @default(autoincrement())
paymentId          Int
workspaceMemberId  Int
value              Decimal
currency           Currency
createdAt          DateTime @default(now())
updatedAt          DateTime @updatedAt

@@unique([paymentId, workspaceMemberId])
payment → Payment (onDelete: Cascade)
workspaceMember → WorkspaceMember
```

Run migration + regenerate Prisma client.

---

## Step 2 — `workspace-stake` module: expose `balanceCurrencyMode` setting

- Add `BalanceCurrencyMode` GraphQL `@registerEnumType` (alongside `StakeRule`).
- Add `balanceCurrencyMode` field to `Workspace` GraphQL entity.
- Add `updateWorkspaceBalanceCurrencyMode(workspace, mode, currentUser, tx)` to `WorkspaceStakeService`:
  - Updates `workspace.balanceCurrencyMode`.
  - Emits `WORKSPACE_UPDATED` history event.
  - After commit, triggers full workspace balance recomputation (see Step 4).
- Add `updateWorkspaceBalanceCurrencyMode` mutation to `WorkspaceStakeMutationResolver`.

---

## Step 3 — New `payment-balance` module

**Files:**

```
src/payment-balance/
  payment-balance.module.ts
  payment-balance.service.ts
  entity/payment-balance-change.entity.ts
  dataloader/payment-balance-changes-by-payment-id.loader.service.ts
  resolver/payment-balance-changes.field.resolver.ts
```

**`PaymentBalanceChange` entity** (`@ObjectType`):

```
workspaceMemberId  Int
value              Decimal
currency           Currency
```

`id` and timestamps are not exposed via GraphQL — internal only.

**`PaymentBalanceService`** — core logic:

### `resolveEffectiveStakes(item, activeMembers, payerId, itemStakes)` → `Map<workspaceMemberId, number>`

| `item.stakeRule` | Logic |
|---|---|
| `EQUALLY` | All active members get stake `1` |
| `ALL_WORKSPACE_OWNER` | WorkspaceMember whose `userId == workspace.ownerId` gets `1`, others `0` |
| `ALL_PAYER` | Payer member gets `1`, others `0` |
| `null` (explicit) | Use `ItemStake` records; active members absent from rows get `0` |

Inactive members are always excluded (implied stake `0`).

### `computeBalanceChanges(payment, effectiveStakes, currency, cost)` → `{ workspaceMemberId, value: Decimal, currency }[]`

- `totalStakes = Σ(stakes of all active members)`
- If `totalStakes == 0`: all members → value `0`
- For each active member `m`:
  - `ratio = stake[m] / totalStakes`
  - payer: `value = cost × (1 − ratio)` (positive)
  - non-payer: `value = −(cost × ratio)` (negative)
- Members with value `0` are still stored (complete per-payment breakdown).

### `syncPaymentBalance(paymentId, tx)`

1. Load payment with item + workspace.
2. Load active workspace members.
3. Load item stakes (if `stakeRule` is `null`).
4. If `workspace.balanceCurrencyMode == DEFAULT_CURRENCY` and `payment.currency != workspace.defaultCurrency`: fetch currency rate for `payment.date`, convert cost.
5. Call `resolveEffectiveStakes` + `computeBalanceChanges`.
6. `deleteMany({ paymentId })` then `createMany(computed rows)` — in the same `tx`.

### `syncItemBalance(itemId, tx)`

Load all payments for the item, call `syncPaymentBalance` for each.

### `syncWorkspaceBalance(workspaceId, tx)`

Load all item IDs in workspace, call `syncItemBalance` for each.

---

## Step 4 — Wire sync into existing services

All calls pass the active transaction `tx` so balance rows are written atomically with the
originating mutation.

| Trigger | Method to call |
|---|---|
| `PaymentService.createPayment` | `syncPaymentBalance(payment.id, tx)` |
| `PaymentService.updatePayment` | `syncPaymentBalance(payment.id, tx)` |
| `PaymentService.deletePayment` | cascade `onDelete: Cascade` handles it — no call needed |
| `OverrideItemStakeService.setItemStakes` | `syncItemBalance(item.id, tx)` |
| `OverrideItemStakeService.setItemStakeRule` | `syncItemBalance(item.id, tx)` |
| `WorkspaceMemberService.create` | `syncWorkspaceBalance(workspaceId, tx)` |
| `WorkspaceMemberService.remove` | `syncWorkspaceBalance(workspaceId, tx)` |
| `WorkspaceStakeService.updateWorkspaceBalanceCurrencyMode` | `syncWorkspaceBalance(workspaceId, tx)` |

`WorkspaceMemberService` join/leave triggers a full workspace sync because items with
`stakeRule == EQUALLY` need recomputation. Items with explicit stakes treat new members as
having implied stake `0`, so their rows are a no-op, but correctness is kept uniform.

---

## Step 5 — GraphQL: `balanceChanges` field on `Payment`

**DataLoader** (`PaymentBalanceChangesByPaymentIdLoader`): batches `paymentId[]` →
`Map<paymentId, PaymentBalanceChange[]>` via a single `findMany` grouped by `paymentId`.

**Field resolver** (`PaymentBalanceChangesFieldResolver`): `@ResolveField() balanceChanges`
on `Payment` type → delegates to the DataLoader.

---

## Step 6 — E2E tests

New file: `test/payment-balance.e2e.spec.ts`

| Scenario | Expected outcome |
|---|---|
| `EQUALLY`, 3 members, payment $90 | Each non-payer −$30, payer +$60 |
| `ALL_PAYER` | All members 0 (payer covers everything, no debt) |
| `ALL_WORKSPACE_OWNER`, non-owner pays | Owner −full cost, payer +full cost |
| Explicit stakes, active member missing a row | Treated as stake 0 |
| `balanceCurrencyMode == DEFAULT_CURRENCY` | Values stored in workspace default currency |
| Member removed | Workspace-wide resync; removed member rows disappear |
| Member added | `EQUALLY` payments recomputed with new member included |
| Stake rule changed on item | All item payments recomputed |

---

## Edge cases to handle

- **`totalStakes == 0`** (e.g. `ALL_PAYER` with inactive payer): all members get value `0`.
- **No currency rate available** for `payment.date` when `DEFAULT_CURRENCY` mode: throw a
  descriptive error from `syncPaymentBalance`.
- **`ALL_WORKSPACE_OWNER` with inactive owner**: owner stake resolves to `0`, falls into the
  `totalStakes == 0` case above.
