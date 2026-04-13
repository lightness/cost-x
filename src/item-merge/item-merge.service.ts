import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { ConsistencyService } from '../consistency/consistency.service';
import Item from '../item/entity/item.entity';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';

@Injectable()
export class ItemMergeService {
  constructor(
    private prisma: PrismaService,
    private consistencyService: ConsistencyService,
    private eventEmitter: EventEmitter2,
  ) {}

  async merge(
    hostItem: Item,
    mergingItem: Item,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    await this.consistencyService.itemsToSameWorkspace.ensureIsBelonging(
      hostItem,
      mergingItem,
    );

    await tx.payment.updateMany({
      data: { title: mergingItem.title },
      where: { itemId: mergingItem.id, title: null },
    });

    await tx.payment.updateMany({
      data: { itemId: hostItem.id },
      where: { itemId: mergingItem.id },
    });

    await tx.itemTag.deleteMany({
      where: { itemId: mergingItem.id },
    });

    await tx.item.delete({
      where: { id: mergingItem.id },
    });

    const result = await tx.item.findUnique({ where: { id: hostItem.id } });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.ITEM_MERGED, {
      actorId: currentUser.id,
      hostItem,
      mergingItem,
      resultItem: result,
      tx,
      workspaceId: hostItem.workspaceId,
    });

    return result;
  }
}
