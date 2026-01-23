import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import Item from '../entities/item.entity';
import { ItemsFilter } from '../dto';
import { PaymentsFilter } from '../../payment/dto';
import { ItemService } from '../item.service';
import { GroupService } from '../../group/group.service';

interface Filter {
  itemsFilter: ItemsFilter;
  paymentsFilter: PaymentsFilter;
}

@Injectable({ scope: Scope.REQUEST })
export class ItemsByWorkspaceIdLoader extends NestedLoader<
  number,
  Item[],
  Filter
> {
  constructor(
    private itemService: ItemService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderWithOptionsFn(
    workspaceIds: number[],
    filter: Filter,
  ): Promise<Item[][]> {
    const items = await this.itemService.list(
      workspaceIds,
      filter.itemsFilter,
      filter.paymentsFilter,
    );

    const itemsByWorkspaceId = this.groupService.groupBy(items, 'workspaceId');

    return workspaceIds.map(
      (workspaceId) => itemsByWorkspaceId.get(workspaceId) || [],
    );
  }
}
