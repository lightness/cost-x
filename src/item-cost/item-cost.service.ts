import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CostOutDto } from './dto';
import { Item, Payment } from '../database/entities';
import { Currency } from '../database/entities/currency.enum';
import { CurrencyRateService } from '../currency-rate/currency-rate.service';

@Injectable()
export class ItemCostService {
  constructor(private configService: ConfigService, private currencyRateService: CurrencyRateService) {}

  async getCost(payments: Payment[]): Promise<CostOutDto> {
    const { costCurrency } = this;

    let value = 0;

    for (const payment of (payments || [])) {
      const [sourceRate, targetRate] = await Promise.all([
        this.getRate(payment.currency, payment.date),
        this.getRate(costCurrency, payment.date),
      ]);

      value += payment.cost * sourceRate / targetRate;
    }

    return { value, currency: costCurrency };
  }

  private get costCurrency(): Currency {
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