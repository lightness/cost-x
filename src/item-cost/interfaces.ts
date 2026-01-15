import type CurrencyRate from '../currency-rate/entities/currency-rate.entity';
import type Payment from '../payment/entities/payment.entity';

export type PaymentLike = Pick<Payment, 'cost' | 'currency' | 'date'>;
export type CurrencyRateLike = Pick<
  CurrencyRate,
  'fromCurrency' | 'toCurrency' | 'date' | 'rate'
>;
