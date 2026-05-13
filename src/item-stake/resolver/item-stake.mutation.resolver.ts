import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { StakeRule } from '../../workspace-stake/entity/stake-rule.enum';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, WorkspacePermission } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { WorkspaceByItemPipe } from '../../common/pipe/workspace-by-item.pipe';
import Item from '../../item/entity/item.entity';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { MemberStake } from '../dto';
import ItemStake from '../entity/item-stake.entity';
import { OverrideItemStakeService } from '../override-item-stake.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class ItemStakeMutationResolver {
  constructor(private overrideItemStakeService: OverrideItemStakeService) {}

  @Mutation(() => [ItemStake])
  @Access.allow({
    or: [
      { owner: 'workspace', scope: AccessScope.WORKSPACE },
      {
        permission: WorkspacePermission.OVERRIDE_ITEM_STAKES,
        scope: AccessScope.WORKSPACE,
        target: 'workspace',
      },
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
    ],
  })
  @Infer('item', { from: fromArg('itemId'), pipes: [ItemByIdPipe] })
  @Infer('workspace', { from: 'item', pipes: [WorkspaceByItemPipe] })
  async setItemStakes(
    @Args('itemId', { type: () => Int }, ItemByIdPipe) item: Item,
    @Args('stakes', { type: () => [MemberStake] }) stakes: MemberStake[],
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.overrideItemStakeService.setItemStakes(item, stakes, currentUser, tx);
  }

  @Mutation(() => Item)
  @Access.allow({
    or: [
      { owner: 'workspace', scope: AccessScope.WORKSPACE },
      {
        permission: WorkspacePermission.OVERRIDE_ITEM_STAKES,
        scope: AccessScope.WORKSPACE,
        target: 'workspace',
      },
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
    ],
  })
  @Infer('item', { from: fromArg('itemId'), pipes: [ItemByIdPipe] })
  @Infer('workspace', { from: 'item', pipes: [WorkspaceByItemPipe] })
  async setItemStakeRule(
    @Args('itemId', { type: () => Int }, ItemByIdPipe) item: Item,
    @Args('stakeRule', { type: () => StakeRule }) stakeRule: StakeRule,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.overrideItemStakeService.setItemStakeRule(item, stakeRule, currentUser, tx);
  }
}
