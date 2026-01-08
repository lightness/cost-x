import { Injectable, Scope } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsAggregationService } from '../payments-aggregation.service';

@Injectable({ scope: Scope.REQUEST })
export class CostInDefaultCurrencyByItemIdLoader extends NestedLoader<number, Decimal, PaymentsFilter> {
  constructor(private paymentsAggregationService: PaymentsAggregationService) {
    super();
  }

  protected async loaderWithOptionsFn(itemIds: number[], filter: PaymentsFilter): Promise<Decimal[]> {
    const map = await this.paymentsAggregationService.getCostInDefaultCurrencyByItemIds(itemIds, filter);

    return itemIds.map(itemId => map.get(itemId) || new Decimal(0));
  }
}