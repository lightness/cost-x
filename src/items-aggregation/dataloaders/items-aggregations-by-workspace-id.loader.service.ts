import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';
import { ItemsAggregation } from '../entities/items-aggregation.entity';
import { ItemsAggregationService } from '../items-aggregation.service';
import { GroupService } from '../../group/group.service';

interface Filter {
  itemsFilter: ItemsFilter;
  paymentsFilter: PaymentsFilter;
}

@Injectable({ scope: Scope.REQUEST })
export class ItemsAggregationsByWorkspaceIdLoader extends NestedLoader<
  number,
  ItemsAggregation,
  Filter
> {
  constructor(
    private itemsAggregationService: ItemsAggregationService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderWithOptionsFn(
    workspaceIds: number[],
    filter: Filter,
  ): Promise<ItemsAggregation[]> {
    const items =
      await this.itemsAggregationService.listByWorkspaceIds(
        workspaceIds,
        filter.itemsFilter,
        filter.paymentsFilter,
      );

    const itemsByWorkspaceId = this.groupService.groupBy(items, 'workspaceId');

    return workspaceIds.map((workspaceId) => {
      const items = itemsByWorkspaceId.get(workspaceId) || [];

      return {
        itemIds: items.map(({ id }) => id),
        ...filter
      };
    });
  }
}
