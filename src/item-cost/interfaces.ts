import CurrencyRate from '../currency-rate/entity/currency-rate.entity';
import Payment from '../payment/entity/payment.entity';

export type PaymentLike = Pick<Payment, 'id' | 'cost' | 'currency' | 'date'>;
export type CurrencyRateLike = Pick<CurrencyRate, 'fromCurrency' | 'toCurrency' | 'date' | 'rate'>;
