import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { GetCurrencyRateInDto } from '../currency-rate/dto';
import { Currency } from '../currency-rate/entities/currency.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyRateLike, PaymentLike } from './interfaces';

@Injectable()
export class DefaultCurrencyCostService {
  constructor(private prisma: PrismaService) {}

  async getDefaultCurrencyByItemIds(itemIds: number[]): Promise<Currency> {
    const items = await this.prisma.item.findMany({
      select: { workspaceId: true },
      where: { id: { in: itemIds } },
    });

    const workspaceIds = items
      .map((item) => item.workspaceId)
      .filter((value, key, arr) => arr.indexOf(value) === key);

    const workspaces = await this.prisma.workspace.findMany({
      select: { defaultCurrency: true },
      where: { id: { in: workspaceIds } },
    });

    const defaultCurrencies = workspaces
      .map((workspace) => workspace.defaultCurrency)
      .filter((value, key, arr) => arr.indexOf(value) === key);

    if (defaultCurrencies.length > 1) {
      throw new InternalServerErrorException(
        `Impossible to get default currencies since different items belongs to workspaces with different default currencies`,
      );
    }

    return defaultCurrencies[0];
  }

  getRequiredCurrencyRates<P extends PaymentLike>(
    payments: P[],
    defaultCurrency: Currency,
  ): GetCurrencyRateInDto[] {
    return payments
      .filter((payment) => payment.currency !== defaultCurrency)
      .map((payment) => ({
        date: payment.date,
        fromCurrency: payment.currency,
        toCurrency: defaultCurrency,
      }));
  }

  getCostInDefaultCurrency<P extends PaymentLike, CR extends CurrencyRateLike>(
    payments: P[],
    currencyRates: CR[],
    defaultCurrency: Currency,
  ): Decimal {
    let cost = new Decimal(0);

    for (const payment of payments || []) {
      cost = Decimal.add(
        cost,
        payment.cost.times(
          this.getRate(payment, currencyRates, defaultCurrency),
        ),
      );
    }

    return cost;
  }

  private getRate(
    payment: PaymentLike,
    currencyRates: CurrencyRateLike[],
    defaultCurrency: Currency,
  ): Decimal {
    if (payment.currency === defaultCurrency) {
      return new Decimal(1);
    }

    const currencyRate = currencyRates.find((currencyRate) => {
      return (
        currencyRate.fromCurrency === payment.currency &&
        currencyRate.toCurrency === defaultCurrency &&
        currencyRate.date.getTime() === payment.date.getTime()
      );
    });

    if (!currencyRate) {
      throw new InternalServerErrorException(`Currency rate was not found`);
    }

    return currencyRate.rate;
  }
}
