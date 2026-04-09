import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { PaymentsFilter } from '../../payment/dto';
import { Permission } from '../../access/interfaces';
import { ItemsFilter } from '../dto';
import Item from '../entity/item.entity';
import { ItemService } from '../item.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
export class ItemQueryResolver {
  constructor(private itemService: ItemService) {}

  @Query(() => Item)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('id'), targetScope: AccessScope.ITEM },
        { level: PermissionLevel.OWNER, permission: Permission.ITEM_READ },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.ITEM_READ },
  ])
  async item(@Args('id', { type: () => Int }) id: number) {
    return this.itemService.getById(id);
  }

  @Query(() => [Item])
  @Access.allow([
    {
      and: [
        { targetId: fromArg('workspaceId'), targetScope: AccessScope.WORKSPACE },
        { level: PermissionLevel.OWNER, permission: Permission.ITEM_READ },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.ITEM_READ },
  ])
  async items(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    return this.itemService.list([workspaceId], itemsFilter, paymentsFilter);
  }
}
