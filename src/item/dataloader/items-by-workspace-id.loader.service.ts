import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloader/nested.loader';
import { GroupService } from '../../group/group.service';
import { PaymentsFilter } from '../../payment/dto';
import { ItemsFilter } from '../dto';
import Item from '../entity/item.entity';
import { ItemService } from '../item.service';

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
