import { Injectable, Scope } from '@nestjs/common';
import { unique } from '../../common/function/unique';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import Item from '../entity/item.entity';
import { ItemService } from '../item.service';

@Injectable({ scope: Scope.REQUEST })
export class ItemByIdLoader extends BaseLoader<number, Item> {
  constructor(
    private itemService: ItemService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(itemIds: number[]): Promise<Item[]> {
    const items = await this.itemService.list({ ids: itemIds.filter(unique) });

    const itemsById = this.groupService.mapBy(items, 'id');

    return itemIds.map((itemId) => itemsById.get(itemId) || null);
  }
}
