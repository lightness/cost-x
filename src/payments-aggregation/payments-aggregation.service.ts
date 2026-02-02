import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { PaymentWhereInput } from '../../generated/prisma/models';
import { CurrencyRateService } from '../currency-rate/currency-rate.service';
import { CostByCurrencyService } from '../item-cost/cost-by-currency.service';
import { DefaultCurrencyCostService } from '../item-cost/default-currency-cost.service';
import { CostByCurrency } from '../item-cost/dto';
import { PaymentsFilter } from '../payment/dto';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsAggregationService {
  constructor(
    private prisma: PrismaService,
    private defaultCurrencyCostService: DefaultCurrencyCostService,
    private costByCurrencyService: CostByCurrencyService,
    private paymentService: PaymentService,
    private currencyRateService: CurrencyRateService,
  ) {}

  // count

  async getPaymentsCount(paymentsFilter: PaymentsFilter): Promise<number> {
    const count = await this.prisma.payment.count({
      where: this.getWhereClause(paymentsFilter),
    });

    return count;
  }

  async getPaymentsCountByItemIds(
    itemIds: number[],
    paymentsFilter: PaymentsFilter,
  ): Promise<Map<number, number>> {
    const rows = await this.prisma.payment.groupBy({
      _count: {
        _all: true,
      },
      by: ['itemId'],
      where: {
        ...this.getWhereClause(paymentsFilter),
        itemId: { in: itemIds },
      },
    });

    return new Map(
      rows.map(({ itemId, _count: { _all: count } }) => [itemId, count]),
    );
  }

  // costInDefaultCurrency

  async getCostInDefaultCurrencyByItemIds(
    itemIds: number[],
    paymentsFilter: PaymentsFilter,
  ): Promise<Map<number, Decimal>> {
    const paymentsByItemId = await this.paymentService.getPaymentsByItemIds(
      itemIds,
      paymentsFilter,
    );
    const allPayments = Array.from(paymentsByItemId.values()).flat();

    const defaultCurrency =
      await this.defaultCurrencyCostService.getDefaultCurrencyByItemIds(
        itemIds,
      );

    const requiredCurrencyRateRequests =
      this.defaultCurrencyCostService.getRequiredCurrencyRates(
        allPayments,
        defaultCurrency,
      );

    const currencyRates = await this.currencyRateService.getMany(
      requiredCurrencyRateRequests,
    );

    return new Map(
      Array.from(paymentsByItemId, ([itemId, payments]) => [
        itemId,
        this.defaultCurrencyCostService.getCostInDefaultCurrency(
          payments,
          currencyRates,
          defaultCurrency,
        ),
      ]),
    );
  }

  // costByCurrency

  async getCostByCurrencyByItemIds(
    itemIds: number[],
    paymentsFilter: PaymentsFilter,
  ): Promise<Map<number, CostByCurrency>> {
    const paymentsByItemId = await this.paymentService.getPaymentsByItemIds(
      itemIds,
      paymentsFilter,
    );

    return new Map(
      Array.from(paymentsByItemId, ([itemId, payments]) => [
        itemId,
        this.costByCurrencyService.getCostByCurrency(payments),
      ]),
    );
  }

  // firstPaymentDate

  async getFirstPaymentDateByItemId(
    itemIds: number[],
    paymentsFilter: PaymentsFilter,
  ): Promise<Map<number, Date>> {
    const rows = await this.prisma.payment.groupBy({
      _min: { date: true },
      by: ['itemId'],
      where: {
        ...this.getWhereClause(paymentsFilter),
        itemId: { in: itemIds },
      },
    });

    return new Map(rows.map(({ itemId, _min: { date } }) => [itemId, date]));
  }

  // lastPaymentDate

  async getLastPaymentDateByItemId(
    itemIds: number[],
    paymentsFilter: PaymentsFilter,
  ): Promise<Map<number, Date>> {
    const rows = await this.prisma.payment.groupBy({
      _max: { date: true },
      by: ['itemId'],
      where: {
        ...this.getWhereClause(paymentsFilter),
        itemId: { in: itemIds },
      },
    });

    return new Map(rows.map(({ itemId, _max: { date } }) => [itemId, date]));
  }

  // other

  private getWhereClause(paymentsFilter: PaymentsFilter): PaymentWhereInput {
    const { dateFrom, dateTo } = paymentsFilter;

    // Not sure
    const result: PaymentWhereInput = {
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    return result;
  }
}
