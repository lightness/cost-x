import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import Item from '../item/entity/item.entity';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { MemberStake } from './entity';
import ItemStake from './entity/item-stake.entity';

@Injectable()
export class ItemStakeService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    item: Item,
    itemStake: MemberStake,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<ItemStake> {
    const createdItemStake = await tx.itemStake.create({
      data: {
        item: { connect: { id: item.id } },
        value: itemStake.value,
        workspaceMember: { connect: { id: itemStake.workspaceMemberId } },
      },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.ITEM_STAKE_CREATED, {
      actorId: currentUser.id,
      itemStake: createdItemStake,
      tx,
      workspaceId: item.workspaceId,
    });

    return createdItemStake;
  }

  async update(
    item: Item,
    itemStake: MemberStake,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<ItemStake> {
    const createdItemStake = await tx.itemStake.update({
      data: {
        item: { connect: { id: item.id } },
        value: itemStake.value,
        workspaceMember: { connect: { id: itemStake.workspaceMemberId } },
      },
      where: {
        itemId_workspaceMemberId: {
          itemId: item.id,
          workspaceMemberId: itemStake.workspaceMemberId,
        },
      },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.ITEM_STAKE_UPDATED, {
      actorId: currentUser.id,
      itemStake: createdItemStake,
      tx,
      workspaceId: item.workspaceId,
    });

    return createdItemStake;
  }
}
