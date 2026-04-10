import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel, WorkspaceRole } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import Item from '../../item/entity/item.entity';
import { Permission } from '../../access/entity/permission.enum';
import User from '../../user/entity/user.entity';
import { MergeItemsInDto } from '../dto';
import { ItemMergeService } from '../item-merge.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class ItemMergeMutationResolver {
  constructor(private itemMergeService: ItemMergeService) {}

  @Mutation(() => Item)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('dto.hostItemId'), targetScope: AccessScope.ITEM, workspaceRole: WorkspaceRole.OWNER },
        { targetId: fromArg('dto.mergingItemId'), targetScope: AccessScope.ITEM, workspaceRole: WorkspaceRole.OWNER },
      ],
    },
    {
      and: [
        { targetId: fromArg('dto.hostItemId'), targetScope: AccessScope.ITEM, workspaceRole: WorkspaceRole.MEMBER, permission: Permission.ITEM_UPDATE },
        { targetId: fromArg('dto.mergingItemId'), targetScope: AccessScope.ITEM, workspaceRole: WorkspaceRole.MEMBER, permission: Permission.ITEM_UPDATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.ITEM_UPDATE },
  ])
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
