import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../../generated/prisma/enums';
import { GetCurrencyRateInDto } from '../currency-rate/dto';
import { CurrencyRateLike, PaymentLike } from './interfaces';

@Injectable()
export class DefaultCurrencyCostService {
  constructor(private configService: ConfigService) {}

  getRequiredCurrencyRates<P extends PaymentLike>(
    payments: P[],
  ): GetCurrencyRateInDto[] {
    return payments
      .filter((payment) => payment.currency !== this.defaultCurrency)
      .map((payment) => ({
        date: payment.date,
        fromCurrency: payment.currency,
        toCurrency: this.defaultCurrency,
      }));
  }

  getCostInDefaultCurrency<P extends PaymentLike, CR extends CurrencyRateLike>(
    payments: P[],
    currencyRates: CR[],
  ): Decimal {
    let cost = new Decimal(0);

    for (const payment of payments || []) {
      cost = Decimal.add(
        cost,
        payment.cost.times(this.getRate(payment, currencyRates)),
      );
    }

    return cost;
  }

  get defaultCurrency(): Currency {
    return this.configService.getOrThrow<Currency>('costCurrency');
  }

  private getRate(
    payment: PaymentLike,
    currencyRates: CurrencyRateLike[],
  ): Decimal {
    if (payment.currency === this.defaultCurrency) {
      return new Decimal(1);
    }

    const currencyRate = currencyRates.find((currencyRate) => {
      return (
        currencyRate.fromCurrency === payment.currency &&
        currencyRate.toCurrency === this.defaultCurrency &&
        currencyRate.date.getTime() === payment.date.getTime()
      );
    });

    if (!currencyRate) {
      throw new InternalServerErrorException(`Currency rate was not found`);
    }

    return currencyRate.rate;
  }
}
