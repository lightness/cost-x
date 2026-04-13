import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access2 } from '../../access/decorator/access2.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { Access2Guard } from '../../access/guard/access2.guard';
import { AccessScope } from '../../access/interfaces';
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
@UseGuards(AuthGuard, Access2Guard)
@UseInterceptors(TransactionInterceptor)
export class ItemMergeMutationResolver {
  constructor(private itemMergeService: ItemMergeService) {}

  @Mutation(() => Item)
  @Access2.allow({
    or: [
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
      {
        and: [
          {
            role: [UserRole.USER],
            target: 'hostItemWorkspace',
            targetScope: AccessScope.WORKSPACE,
          },
          {
            role: [UserRole.USER],
            target: 'mergingItemWorkspace',
            targetScope: AccessScope.WORKSPACE,
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
