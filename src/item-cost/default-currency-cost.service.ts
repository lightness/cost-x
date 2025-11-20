import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CostOutDto } from './dto';
import { Item, Payment } from '../database/entities';
import { Currency } from '../database/entities/currency.enum';
import { CurrencyRateService } from '../currency-rate/currency-rate.service';

@Injectable()
export class DefaultCurrencyCostService {
  constructor(private configService: ConfigService, private currencyRateService: CurrencyRateService) {}

  async getCostInDefaultCurrency(payments: Payment[]): Promise<CostOutDto> {
    const { defaultCurrency } = this;

    let cost = 0;

    for (const payment of (payments || [])) {
      const [sourceRate, targetRate] = await Promise.all([
        this.getRate(payment.currency, payment.date),
        this.getRate(defaultCurrency, payment.date),
      ]);

      cost += payment.cost * sourceRate / targetRate;
    }

    return { cost, currency: defaultCurrency };
  }

  get defaultCurrency(): Currency {
    return this.configService.getOrThrow<Currency>('costCurrency');
  }

  private async getRate(fromCurrency: Currency, date: string): Promise<number> {
    if (fromCurrency === Currency.BYN) {
      return 1;
    }

    const { rate } = await this.currencyRateService.get({ fromCurrency, toCurrency: Currency.BYN, date });

    return rate;
  }
}