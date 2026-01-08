import { Injectable, Scope } from '@nestjs/common';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsAggregationService } from '../payments-aggregation.service';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';

@Injectable({ scope: Scope.REQUEST })
export class FirstPaymentDateByItemIdLoader extends NestedLoader<number, Date, PaymentsFilter> {
  constructor(private paymentsAggregationService: PaymentsAggregationService) {
    super();
  }

  protected async loaderWithOptionsFn(itemIds: number[], filter: PaymentsFilter): Promise<Date[]> {
    const map = await this.paymentsAggregationService.getFirstPaymentDateByItemId(itemIds, filter);

    return itemIds.map(itemId => map.get(itemId) || null);
  }
}