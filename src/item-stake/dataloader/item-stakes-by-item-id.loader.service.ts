import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import ItemStake from '../entity/item-stake.entity';

@Injectable({ scope: Scope.REQUEST })
export class ItemStakesByItemIdLoader extends BaseLoader<number, ItemStake[]> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(itemIds: number[]): Promise<ItemStake[][]> {
    const items = await this.prisma.itemStake.findMany({
      where: { itemId: { in: itemIds } },
    });

    const itemStakesByItemId = this.groupService.groupBy(items, 'itemId');

    return itemIds.map((itemId) => itemStakesByItemId.get(itemId) || []);
  }
}
