# Currency-Rate Module

Provides historical exchange rates between supported currencies.

---

## Table of Contents

- [Overview](#overview)
- [Object Type: `CurrencyRate`](#object-type-currencyrate)
- [Queries](#queries)
  - [`currencyRate`](#currencyrate)

---

## Overview

Rates are derived relative to BYN (Belarusian Ruble) and fetched from the National Bank of Belarus (NBRB) public API on first request, then cached indefinitely in the database. Same-currency conversions always return `1`.

Supported currencies: `USD`, `EUR`, `BYN`.

---

## Object Type: `CurrencyRate`

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Record ID |
| `createdAt` | `DateIso!` | When the rate was cached |
| `fromCurrency` | `Currency!` | Source currency |
| `toCurrency` | `Currency!` | Target currency |
| `date` | `Date!` | Date the rate applies to (YYYY-MM-DD) |
| `rate` | `Decimal!` | Exchange rate (multiply `fromCurrency` amount by `rate` to get `toCurrency` amount) |

---

## Queries

### `currencyRate`

Returns the exchange rate between two currencies on a given date.

```graphql
query {
  currencyRate(fromCurrency: USD, toCurrency: EUR, date: "2024-03-15") {
    fromCurrency
    toCurrency
    date
    rate
  }
}
```

**Auth**: none (public)

**Arguments**:

| Argument | Type | Rules |
|---|---|---|
| `fromCurrency` | `Currency!` | One of `USD`, `EUR`, `BYN` |
| `toCurrency` | `Currency!` | One of `USD`, `EUR`, `BYN` |
| `date` | `Date!` | Date in YYYY-MM-DD format |

**Behavior**:
- If `fromCurrency === toCurrency`, returns `rate: 1` without a database or API call
- Otherwise, fetches or computes the rate using BYN as an intermediate base:
  - `rate = fromCurrency→BYN rate / toCurrency→BYN rate`
- On first request for a currency/date pair, fetches from the NBRB API and caches the result — subsequent requests for the same pair are served from the database
