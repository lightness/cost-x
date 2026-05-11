import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsAggregation } from '../../payments-aggregation/entity/payments-aggregation.entity';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { WorkspaceByItemIdLoader } from '../dataloader/workspace-by-item-id.loader.service';
import Item from '../entity/item.entity';

@Resolver(() => Item)
export class ItemFieldResolver {
  constructor(private workspaceByItemIdLoader: WorkspaceByItemIdLoader) {}

  @ResolveField(() => PaymentsAggregation)
  async paymentsAggregation(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return {
      itemIds: [item.id],
      paymentsFilter,
    };
  }

  @ResolveField(() => Workspace)
  async workspace(@Parent() item: Item) {
    return this.workspaceByItemIdLoader.load(item.id);
  }
}
