import { Injectable, Scope } from '@nestjs/common';
import { FilteredPaymentsLoader } from '../../payment/dataloaders/filtered-payments.loader.service';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsAggregationService } from '../payments-aggregation.service';
import { CostByCurrency } from '../../item-cost/dto';
import { Currency } from '../../currency-rate/entities/currency.enum';

@Injectable({ scope: Scope.REQUEST })
export class CostByCurrencyByItemIdLoader extends FilteredPaymentsLoader<number, CostByCurrency> {
  constructor(private paymentsAggregationService: PaymentsAggregationService) {
    super();
  }

  protected async loaderWithOptionsFn(itemIds: number[], filter: PaymentsFilter): Promise<CostByCurrency[]> {
    const map = await this.paymentsAggregationService.getCostByCurrencyByItemIds(itemIds, filter);

    return itemIds.map(itemId => map.get(itemId) || this.defaultValue);
  }

  private get defaultValue(): CostByCurrency {
    return {
      [Currency.BYN]: 0,
      [Currency.EUR]: 0,
      [Currency.USD]: 0,
    };
  }
}