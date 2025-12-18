import { Injectable, Scope } from '@nestjs/common';
import { FilteredPaymentsLoader } from '../../payment/dataloaders/filtered-payments.loader.service';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsAggregationService } from '../payments-aggregation.service';

@Injectable({ scope: Scope.REQUEST })
export class CostInDefaultCurrencyByItemIdLoader extends FilteredPaymentsLoader<number, number> {
  constructor(private paymentsAggregationService: PaymentsAggregationService) {
    super();
  }

  protected async loaderWithOptionsFn(itemIds: number[], filter: PaymentsFilter): Promise<number[]> {
    const map = await this.paymentsAggregationService.getCostInDefaultCurrencyByItemIds(itemIds, filter);

    return itemIds.map(itemId => map.get(itemId) || 0);
  }
}