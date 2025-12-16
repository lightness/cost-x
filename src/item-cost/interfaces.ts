import { CurrencyRate, Payment } from '../database/entities';

export type PaymentLike = Pick<Payment, 'cost' | 'currency' | 'date'>;
export type CurrencyRateLike = Pick<CurrencyRate, 'fromCurrency' | 'toCurrency' | 'date' | 'rate'>;
