import { Injectable, Scope } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../../currency-rate/entities/currency.enum';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import type { CostByCurrency } from '../../item-cost/dto';
import type { PaymentsFilter } from '../../payment/dto';
import type { PaymentsAggregationService } from '../payments-aggregation.service';

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
