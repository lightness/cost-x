import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../database/entities';
import { PaymentsFilter } from '../payment/dto';
import { DefaultCurrencyCostService } from '../item-cost/default-currency-cost.service';
import { PaymentService } from '../payment/payment.service';
import { CurrencyRateService } from '../currency-rate/currency-rate.service';

@Injectable()
export class PaymentsAggregationService {
  constructor(
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    private defaultCurrencyCostService: DefaultCurrencyCostService,
    private paymentService: PaymentService,
    private currencyRateService: CurrencyRateService,
  ) { }

  // count

  async getPaymentsCount(paymentsFilter: PaymentsFilter): Promise<number> {
    const row = await this.paymentRepository
      .createQueryBuilder('p')
      .where(this.getWhereClause(paymentsFilter), paymentsFilter)
      .select('COUNT(*)', 'count')
      .getRawOne<{ count: number }>()

    return row.count;
  }

  async getPaymentsCountByItemIds(itemIds: number[], paymentsFilter: PaymentsFilter): Promise<Map<number, number>> {
    const rows = await this.paymentRepository
      .createQueryBuilder('p')
      .where(this.getWhereClause(paymentsFilter), paymentsFilter)
      .andWhere('p.itemId IN (:...itemIds)', { itemIds })
      .groupBy('p.itemId')
      .select('p.itemId', 'itemId')
      .addSelect('COUNT(*)', 'count')
      .getRawMany<{ itemId: number; count: number }>()

    return new Map(rows.map(({ itemId, count }) => [itemId, count]));
  }

  // costInDefaultCurrency

  async getCostInDefaultCurrency(paymentsFilter: PaymentsFilter): Promise<number> {
    const payments = await this.paymentService.list(paymentsFilter);
    const requiredCurrencyRateRequests = this.defaultCurrencyCostService.getRequiredCurrencyRates(payments);
    const currencyRates = await this.currencyRateService.getMany(requiredCurrencyRateRequests);

    return this.defaultCurrencyCostService.getCostInDefaultCurrency(payments, currencyRates);
  }

  async getCostInDefaultCurrencyByItemIds(itemIds: number[], paymentsFilter: PaymentsFilter): Promise<Map<number, number>> {
    const paymentsByItemId = await this.paymentService.getPaymentsByItemIds(itemIds, paymentsFilter);
    const allPayments = Array.from(paymentsByItemId.values()).flat();
    const requiredCurrencyRateRequests = this.defaultCurrencyCostService.getRequiredCurrencyRates(allPayments);
    const currencyRates = await this.currencyRateService.getMany(requiredCurrencyRateRequests);

    return new Map(
      Array.from(
        paymentsByItemId, 
        ([itemId, payments]) => [itemId, this.defaultCurrencyCostService.getCostInDefaultCurrency(payments, currencyRates)],
      )
    );
  }

  // other

  private getWhereClause(paymentsFilter: PaymentsFilter): string {
    const { dateFrom, dateTo } = paymentsFilter;

    if (dateFrom && dateTo) {
      return 'p.date BETWEEN :dateFrom AND :dateTo';
    }

    if (dateFrom) {
      return 'p.date >= :dateFrom';
    }

    if (dateTo) {
      return 'p.date < :dateTo';
    }

    return '';
  }

}