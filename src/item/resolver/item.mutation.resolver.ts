import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { UserRole } from '../../user/entity/user-role.enum';
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
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('workspaceId'),
      targetScope: AccessScope.WORKSPACE,
    },
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
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.ITEM,
    },
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
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.ITEM,
    },
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
