# Payment Module

Manages individual expense records within an item.

---

## Table of Contents

- [Object Type: `Payment`](#object-type-payment)
- [Queries](#queries)
  - [`payment`](#paymentid-int)
  - [`payments`](#paymentsitemid-int)
- [Mutations](#mutations)
  - [`createPayment`](#createpaymentitemid-int)
  - [`updatePayment`](#updatepaymentpaymentid-int)
  - [`deletePayment`](#deletepaymentpaymentid-int)
- [Filters](#filters)

---

## Object Type: `Payment`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Payment ID |
| `createdAt` | `DateIso` | Record creation timestamp |
| `updatedAt` | `DateIso` | Last update timestamp |
| `title` | `String` | Optional label for the payment |
| `cost` | `Decimal!` | Amount |
| `currency` | `Currency!` | `USD`, `EUR`, or `BYN` |
| `date` | `Date!` | Date of the expense (YYYY-MM-DD) |
| `itemId` | `Int!` | Owning item |
| `item` | `Item` | Resolved: the owning item |

---

## Queries

### `payment(id: Int!)`

Returns a single payment by ID.

```graphql
query {
  payment(id: 55) {
    id
    title
    cost
    currency
    date
    item { title }
  }
}
```

**Auth**: required · **Role**: `USER` (own payments only) or `ADMIN`

---

### `payments(itemId: Int!)`

Returns all payments for an item, with optional date filtering.

```graphql
query {
  payments(
    itemId: 10
    paymentsFilter: { dateFrom: "2024-01-01", dateTo: "2024-06-30" }
  ) {
    id
    title
    cost
    currency
    date
  }
}
```

**Auth**: required · **Role**: `USER` (must own the item) or `ADMIN`

**Arguments**:

| Argument | Type | Description |
|---|---|---|
| `itemId` | `Int!` | Item to list payments for |
| `paymentsFilter` | `PaymentsFilter` | Optional date range filter |

---

## Mutations

### `createPayment(itemId: Int!)`

Records a new payment under an item.

```graphql
mutation {
  createPayment(
    itemId: 10
    dto: {
      cost: "49.99"
      currency: USD
      date: "2024-03-15"
      title: "Monthly subscription"
    }
  ) {
    id
    cost
    currency
    date
  }
}
```

**Auth**: required · **Role**: `USER` (must own the item) or `ADMIN`

**Input**:

| Field | Type | Rules |
|---|---|---|
| `cost` | `Decimal!` | Amount (numeric string accepted) |
| `currency` | `Currency!` | `USD`, `EUR`, or `BYN` |
| `date` | `Date!` | Date of the expense (YYYY-MM-DD) |
| `title` | `String` | Optional label |

**Behavior**:
- Records a `PAYMENT_CREATED` entry in the workspace audit history

---

### `updatePayment(paymentId: Int!)`

Updates an existing payment.

```graphql
mutation {
  updatePayment(
    paymentId: 55
    dto: {
      cost: "59.99"
      currency: EUR
      date: "2024-03-20"
      title: "Updated subscription"
    }
  ) {
    id
    cost
    currency
    date
  }
}
```

**Auth**: required · **Role**: `USER` (must own the payment) or `ADMIN`

**Input**: same fields as `createPayment`, all required.

**Behavior**:
- Records a `PAYMENT_UPDATED` entry in the workspace audit history (old and new values both captured)

---

### `deletePayment(paymentId: Int!)`

Permanently deletes a payment.

```graphql
mutation {
  deletePayment(paymentId: 55)
}
```

**Auth**: required · **Role**: `USER` (must own the payment) or `ADMIN`

Returns `Boolean` (`true` on success).

**Behavior**:
- Records a `PAYMENT_DELETED` entry in the workspace audit history

---

## Filters

### `PaymentsFilter`

| Field | Type | Description |
|---|---|---|
| `dateFrom` | `Date` | Include payments on or after this date (YYYY-MM-DD) |
| `dateTo` | `Date` | Include payments on or before this date (YYYY-MM-DD) |
