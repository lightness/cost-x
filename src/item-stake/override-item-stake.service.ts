import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { diff } from 'radash';
import { Prisma, StakeRule } from '../../generated/prisma/client';
import { duplicates } from '../common/function/duplicates';
import Item from '../item/entity/item.entity';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { WorkspaceMemberNotBelongingToWorkspaceError } from '../workspace-membership/error';
import { WorkspaceMemberService } from '../workspace-membership/workspace-member.service';
import { MemberStake } from './dto';
import ItemStake from './entity/item-stake.entity';
import {
  NonPositiveSumOfStakeValuesError,
  WorkspaceMemberStakeDuplicatedError,
  WorkspaceMemberStakeHasNegativeValueError,
  WorkspaceMemberStakeNotSpecifiedError,
} from './error';
import { ItemStakeService } from './item-stake.service';

@Injectable()
export class OverrideItemStakeService {
  constructor(
    private itemStakeService: ItemStakeService,
    private prisma: PrismaService,
    private workspaceMemberService: WorkspaceMemberService,
    private eventEmitter: EventEmitter2,
  ) {}

  async setItemStakes(
    item: Item,
    stakes: MemberStake[],
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<ItemStake[]> {
    await this.validateStakes(item, stakes, tx);

    const existingItemStakes = await this.itemStakeService.getByItemId(item.id, tx);

    // set item stakes
    const newItemStakes = await this.itemStakeService.bulkCreateOrUpdate(item, stakes, tx);

    // set stakeRule to null
    const updatedItem = item.stakeRule
      ? await tx.item.update({
          data: { stakeRule: null },
          where: { id: item.id },
        })
      : item;

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.ITEM_STAKES_CHANGED, {
      actorId: currentUser.id,
      newValue: {
        itemId: item.id,
        stakeRule: updatedItem.stakeRule,
        stakes: newItemStakes,
      },
      oldValue: {
        itemId: item.id,
        stakeRule: item.stakeRule,
        stakes: existingItemStakes,
      },
      tx,
      workspaceId: item.workspaceId,
    });

    return newItemStakes;
  }

  async setItemStakeRule(
    item: Item,
    stakeRule: StakeRule,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Item> {
    if (item.stakeRule === stakeRule) {
      return item;
    }

    const existingItemStakes = await this.itemStakeService.getByItemId(item.id, tx);

    // set stakeRule to item
    const updatedItem = await tx.item.update({
      data: { stakeRule },
      where: { id: item.id },
    });

    // remove itemStakes
    await this.itemStakeService.bulkDelete(item, tx);

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.ITEM_STAKES_CHANGED, {
      actorId: currentUser.id,
      newValue: {
        itemId: item.id,
        stakeRule: updatedItem.stakeRule,
        stakes: null,
      },
      oldValue: {
        itemId: item.id,
        stakeRule: item.stakeRule,
        stakes: existingItemStakes,
      },
      tx,
      workspaceId: item.workspaceId,
    });

    return updatedItem;
  }

  private async validateStakes(
    item: Item,
    stakes: MemberStake[],
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const receivedMemberIds = stakes.map((stake) => stake.workspaceMemberId);
    const duplicatedMemberIds = receivedMemberIds.filter(duplicates);

    if (duplicatedMemberIds.length > 0) {
      throw new WorkspaceMemberStakeDuplicatedError(duplicatedMemberIds);
    }

    const allActiveMembers = await this.workspaceMemberService.listActiveByWorkspaceId(
      item.workspaceId,
      tx,
    );
    const allActiveMemberIds = allActiveMembers.map((member) => member.id);
    const missingMemberIds = diff(allActiveMemberIds, receivedMemberIds);

    if (missingMemberIds.length > 0) {
      throw new WorkspaceMemberStakeNotSpecifiedError(missingMemberIds);
    }

    const extraMemberIds = diff(receivedMemberIds, allActiveMemberIds);

    if (extraMemberIds.length > 0) {
      throw new WorkspaceMemberNotBelongingToWorkspaceError(extraMemberIds);
    }

    const negativeValueMemberIds = stakes
      .filter((stake) => stake.value < 0)
      .map((stake) => stake.workspaceMemberId);

    if (negativeValueMemberIds.length > 0) {
      throw new WorkspaceMemberStakeHasNegativeValueError(negativeValueMemberIds);
    }

    const sumOfStakeValues = stakes.map((stake) => stake.value).reduce((acc, cur) => acc + cur, 0);

    if (sumOfStakeValues <= 0) {
      throw new NonPositiveSumOfStakeValuesError(sumOfStakeValues);
    }
  }
}
