import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, WorkspaceRole } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { WorkspaceByIdPipe } from '../../common/pipe/workspace-by-id.pipe';
import { WorkspaceByItemPipe } from '../../common/pipe/workspace-by-item.pipe';
import { PaymentsFilter } from '../../payment/dto';
import { UserRole } from '../../user/entity/user-role.enum';
import { ItemsFilter } from '../dto';
import Item from '../entity/item.entity';
import { ItemService } from '../item.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
export class ItemQueryResolver {
  constructor(private itemService: ItemService) {}

  @Query(() => Item)
  @Access.allow({
    or: [
      { target: 'workspace', targetScope: AccessScope.WORKSPACE, workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER] },
      { role: [UserRole.ADMIN], targetScope: AccessScope.USER },
    ],
  })
  @Infer('item', { from: fromArg('id'), pipes: [ItemByIdPipe] })
  @Infer('workspace', { from: 'item', pipes: [WorkspaceByItemPipe] })
  async item(@Args('id', { type: () => Int }) id: number) {
    return this.itemService.getById(id);
  }

  @Query(() => [Item])
  @Access.allow({
    or: [
      { target: 'workspace', targetScope: AccessScope.WORKSPACE, workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER] },
      { role: [UserRole.ADMIN], targetScope: AccessScope.USER },
    ],
  })
  @Infer('workspace', { from: fromArg('workspaceId'), pipes: [WorkspaceByIdPipe] })
  async items(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    return this.itemService.list([workspaceId], itemsFilter, paymentsFilter);
  }
}
