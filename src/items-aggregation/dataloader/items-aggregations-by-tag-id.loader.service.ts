import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloader/nested.loader';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';
import { ItemsAggregation } from '../entity/items-aggregation.entity';
import { ItemsAggregationService } from '../items-aggregation.service';

interface Filter {
  itemsFilter: ItemsFilter;
  paymentsFilter: PaymentsFilter;
}

@Injectable({ scope: Scope.REQUEST })
export class ItemsAggregationsByTagIdLoader extends NestedLoader<
  number,
  ItemsAggregation,
  Filter
> {
  constructor(private itemsAggregationService: ItemsAggregationService) {
    super();
  }

  protected async loaderWithOptionsFn(
    tagIds: number[],
    filter: Filter,
  ): Promise<ItemsAggregation[]> {
    const itemIdsByTagId =
      await this.itemsAggregationService.getIdsGroupedByTagId(
        { ...filter.itemsFilter, tagIds },
        filter.paymentsFilter,
      );

    return tagIds.map((tagId) => {
      const itemIds = itemIdsByTagId.get(tagId) || [];

      return {
        itemIds,
        itemsFilter: { ...filter.itemsFilter, tagIds },
        paymentsFilter: filter.paymentsFilter,
      };
    });
  }
}
