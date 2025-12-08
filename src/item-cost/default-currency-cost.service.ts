import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetCurrencyRateInDto } from '../currency-rate/dto';
import { Currency } from '../currency-rate/entities/currency.enum';
import { CurrencyRateLike, PaymentLike } from './interfaces';

@Injectable()
export class DefaultCurrencyCostService {
  constructor(
    private configService: ConfigService,
  ) { }

  getRequiredCurrencyRates<P extends PaymentLike>(payments: P[]): GetCurrencyRateInDto[] {
    return payments
      .filter((payment) => payment.currency !== this.defaultCurrency)
      .map((payment) => ({
        fromCurrency: payment.currency,
        toCurrency: this.defaultCurrency,
        date: payment.date,
      }));
  }

  getCostInDefaultCurrency<P extends PaymentLike, CR extends CurrencyRateLike>(payments: P[], currencyRates: CR[]): number {
    let cost = 0;

    for (const payment of (payments || [])) {
      cost += payment.cost * this.getRate(payment, currencyRates);
    }

    return cost;
  }

  get defaultCurrency(): Currency {
    return this.configService.getOrThrow<Currency>('costCurrency');
  }

  private getRate(payment: PaymentLike, currencyRates: CurrencyRateLike[]): number {
    if (payment.currency === this.defaultCurrency) {
      return 1;
    }

    const currencyRate = currencyRates.find((currencyRate) => {
      return currencyRate.fromCurrency === payment.currency
        && currencyRate.toCurrency === this.defaultCurrency
        && currencyRate.date.getTime() === payment.date.getTime()
    });

    if (!currencyRate) {
      throw new InternalServerErrorException(`Currency rate was not found`);
    }

    return currencyRate.rate;
  }
}