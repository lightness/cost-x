import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { Permission } from '../../access/interfaces';
import User from '../../user/entity/user.entity';
import { ItemInDto } from '../dto';
import Item from '../entity/item.entity';
import { ItemService } from '../item.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class ItemMutationResolver {
  constructor(private itemService: ItemService) {}

  @Mutation(() => Item)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('workspaceId'), targetScope: AccessScope.WORKSPACE },
        { level: PermissionLevel.OWNER, permission: Permission.ITEM_CREATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.ITEM_CREATE },
  ])
  async createItem(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { type: () => ItemInDto }) dto: ItemInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemService.create(workspaceId, dto, currentUser, tx);
  }

  @Mutation(() => Item)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('id'), targetScope: AccessScope.ITEM },
        { level: PermissionLevel.OWNER, permission: Permission.ITEM_UPDATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.ITEM_UPDATE },
  ])
  async updateItem(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => ItemInDto }) dto: ItemInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemService.update(id, dto, currentUser, tx);
  }

  @Mutation(() => Boolean)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('id'), targetScope: AccessScope.ITEM },
        { level: PermissionLevel.OWNER, permission: Permission.ITEM_DELETE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.ITEM_DELETE },
  ])
  async deleteItem(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.itemService.delete(id, currentUser, tx);

    return true;
  }
}
