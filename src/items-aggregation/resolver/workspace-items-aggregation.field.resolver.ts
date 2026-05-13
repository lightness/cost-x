import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { ItemsAggregationsByWorkspaceIdLoader } from '../dataloader/items-aggregations-by-workspace-id.loader.service';
import { ItemsAggregation } from '../entity/items-aggregation.entity';

@Resolver(() => Workspace)
export class WorkspaceItemsAggregationFieldResolver {
  constructor(private itemsAggregationsByWorkspaceIdLoader: ItemsAggregationsByWorkspaceIdLoader) {}

  @ResolveField(() => ItemsAggregation)
  async itemsAggregation(
    @Parent() workspace: Workspace,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return this.itemsAggregationsByWorkspaceIdLoader
      .withOptions({ itemsFilter, paymentsFilter })
      .load(workspace.id);
  }
}
