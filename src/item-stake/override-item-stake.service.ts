import { Injectable } from '@nestjs/common';
import { diff } from 'radash';
import { Prisma, StakeRule } from '../../generated/prisma/client';
import { unique } from '../common/function/unique';
import Item from '../item/entity/item.entity';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceMember } from '../workspace-membership/entity/workspace-member.entity';
import { WorkspaceMemberNotBelongingToWorkspaceError } from '../workspace-membership/error';
import { WorkspaceMemberService } from '../workspace-membership/workspace-member.service';
import { MemberStake } from './entity';
import ItemStake from './entity/item-stake.entity';
import { WorkspaceMemberStakeNotSpecifiedError } from './error';
import { ItemStakeService } from './item-stake.service';

@Injectable()
export class OverrideItemStakeService {
  constructor(
    private itemStakeService: ItemStakeService,
    private prisma: PrismaService,
    private workspaceMemberService: WorkspaceMemberService,
  ) {}

  async updateItemStakes(
    item: Item,
    stakes: MemberStake[],
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<ItemStake[]> {
    const receivedMemberIds = stakes.map((stake) => stake.workspaceMemberId).filter(unique);
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

    return Promise.all(
      stakes.map((stake) => this.itemStakeService.update(item, stake, currentUser, tx)),
    );
  }

  async updateItemStakesByRule(
    item: Item,
    stakeRule: StakeRule,
    reporterMember: WorkspaceMember,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    if (item.workspaceId !== reporterMember.workspaceId) {
      throw new WorkspaceMemberNotBelongingToWorkspaceError([reporterMember.id]);
    }

    const workspace = await tx.workspace.findFirst({ where: { id: item.workspaceId } });

    const allActiveMembers = await this.workspaceMemberService.listActiveByWorkspaceId(
      item.workspaceId,
      tx,
    );

    const ownerMember = allActiveMembers.find(
      (workspaceMember) => workspaceMember.userId === workspace.ownerId,
    );

    const stakes = this.calculateStakesBasedOnRule(
      stakeRule,
      allActiveMembers,
      reporterMember,
      ownerMember,
    );

    return Promise.all(
      stakes.map((stake) => this.itemStakeService.update(item, stake, currentUser, tx)),
    );
  }

  private calculateStakesBasedOnRule(
    stakeRule: StakeRule,
    allActiveMembers: WorkspaceMember[],
    reporterMember: WorkspaceMember,
    ownerMember: WorkspaceMember,
  ): MemberStake[] {
    switch (stakeRule) {
      case StakeRule.EQUALLY:
        return allActiveMembers.map((workspaceMember) => ({
          value: 1,
          workspaceMemberId: workspaceMember.id,
        }));
      case StakeRule.ALL_PAYER:
        return allActiveMembers.map((workspaceMember) => ({
          value: workspaceMember.id === reporterMember.id ? 1 : 0,
          workspaceMemberId: workspaceMember.id,
        }));
      case StakeRule.ALL_WORKSPACE_OWNER:
        return allActiveMembers.map((workspaceMember) => ({
          value: workspaceMember.id === ownerMember.id ? 1 : 0,
          workspaceMemberId: workspaceMember.id,
        }));
    }
  }
}
