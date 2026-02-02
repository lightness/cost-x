import { Injectable, Scope } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../../currency-rate/entity/currency.enum';
import { NestedLoader } from '../../graphql/dataloader/nested.loader';
import { CostByCurrency } from '../../item-cost/dto';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsAggregationService } from '../payments-aggregation.service';

@Injectable({ scope: Scope.REQUEST })
export class CostByCurrencyByItemIdLoader extends NestedLoader<
  number,
  CostByCurrency,
  PaymentsFilter
> {
  constructor(private paymentsAggregationService: PaymentsAggregationService) {
    super();
  }

  protected async loaderWithOptionsFn(
    itemIds: number[],
    filter: PaymentsFilter,
  ): Promise<CostByCurrency[]> {
    const map =
      await this.paymentsAggregationService.getCostByCurrencyByItemIds(
        itemIds,
        filter,
      );

    return itemIds.map((itemId) => map.get(itemId) || this.defaultValue);
  }

  private get defaultValue(): CostByCurrency {
    return {
      [Currency.BYN]: new Decimal(0),
      [Currency.EUR]: new Decimal(0),
      [Currency.USD]: new Decimal(0),
    };
  }
}
