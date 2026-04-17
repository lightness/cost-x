import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, WorkspaceRole } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { WorkspaceByItemPipe } from '../../common/pipe/workspace-by-item.pipe';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import Item from '../../item/entity/item.entity';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { MergeItemsInDto } from '../dto';
import { ItemMergeService } from '../item-merge.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class ItemMergeMutationResolver {
  constructor(private itemMergeService: ItemMergeService) {}

  @Mutation(() => Item)
  @Access.allow({
    or: [
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
      {
        and: [
          {
            target: 'hostItemWorkspace',
            scope: AccessScope.WORKSPACE,
            workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER],
          },
          {
            target: 'mergingItemWorkspace',
            scope: AccessScope.WORKSPACE,
            workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER],
          },
        ],
      },
    ],
  })
  @Infer('hostItemWorkspace', {
    from: fromArg('dto.hostItemId'),
    pipes: [ItemByIdPipe, WorkspaceByItemPipe],
  })
  @Infer('mergingItemWorkspace', {
    from: fromArg('dto.mergingItemId'),
    pipes: [ItemByIdPipe, WorkspaceByItemPipe],
  })
  async mergeItems(
    @Args('dto') _: MergeItemsInDto,
    @DeepArgs('dto.hostItemId', ItemByIdPipe) hostItem: Item,
    @DeepArgs('dto.mergingItemId', ItemByIdPipe) mergingItem: Item,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemMergeService.merge(hostItem, mergingItem, currentUser, tx);
  }
}
