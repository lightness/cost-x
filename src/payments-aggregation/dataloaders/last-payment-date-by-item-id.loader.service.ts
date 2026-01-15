import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsAggregationService } from '../payments-aggregation.service';

@Injectable({ scope: Scope.REQUEST })
export class LastPaymentDateByItemIdLoader extends NestedLoader<
  number,
  Date,
  PaymentsFilter
> {
  constructor(private paymentsAggregationService: PaymentsAggregationService) {
    super();
  }

  protected async loaderWithOptionsFn(
    itemIds: number[],
    filter: PaymentsFilter,
  ): Promise<Date[]> {
    const map =
      await this.paymentsAggregationService.getLastPaymentDateByItemId(
        itemIds,
        filter,
      );

    return itemIds.map((itemId) => map.get(itemId) || null);
  }
}
