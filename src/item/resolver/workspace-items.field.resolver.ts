import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaymentsFilter } from '../../payment/dto';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { ItemsByWorkspaceIdLoader } from '../dataloader/items-by-workspace-id.loader.service';
import { ItemsFilter } from '../dto';
import Item from '../entity/item.entity';

@Resolver(() => Workspace)
export class WorkspaceItemsFieldResolver {
  constructor(private itemsByWorkspaceLoader: ItemsByWorkspaceIdLoader) {}

  @ResolveField(() => [Item])
  async items(
    @Parent() workspace: Workspace,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return this.itemsByWorkspaceLoader
      .withOptions({ itemsFilter, paymentsFilter })
      .load(workspace.id);
  }
}
