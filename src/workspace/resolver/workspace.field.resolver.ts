import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ItemsByWorkspaceIdLoader } from '../../item/dataloader/items-by-workspace-id.loader.service';
import { ItemsFilter } from '../../item/dto';
import Item from '../../item/entity/item.entity';
import { ItemsAggregationsByWorkspaceIdLoader } from '../../items-aggregation/dataloader/items-aggregations-by-workspace-id.loader.service';
import { ItemsAggregation } from '../../items-aggregation/entity/items-aggregation.entity';
import { PaymentsFilter } from '../../payment/dto';
import { TagsByWorkspaceIdLoader } from '../../tag/dataloader/tags-by-workspace-id.loader.service';
import { TagsFilter } from '../../tag/dto';
import Tag from '../../tag/entity/tag.entity';
import { WorkspaceHistory } from '../../workspace-history/entity/workspace-history.entity';
import { WorkspaceHistoryService } from '../../workspace-history/workspace-history.service';
import { Workspace } from '../entity/workspace.entity';

@Resolver(() => Workspace)
export class WorkspaceFieldResolver {
  constructor(
    private itemsByWorkspaceLoader: ItemsByWorkspaceIdLoader,
    private tagsByWorkspaceIdLoader: TagsByWorkspaceIdLoader,
    private itemsAggregationsByWorkspaceIdLoader: ItemsAggregationsByWorkspaceIdLoader,
    private workspaceHistoryService: WorkspaceHistoryService,
  ) {}

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

  @ResolveField(() => [Tag])
  async tags(
    @Parent() workspace: Workspace,
    @Args('tagsFilter', { nullable: true }) tagsFilter: TagsFilter,
  ) {
    return this.tagsByWorkspaceIdLoader.withOptions(tagsFilter).load(workspace.id);
  }

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

  @ResolveField(() => [WorkspaceHistory])
  async history(@Parent() workspace: Workspace) {
    return this.workspaceHistoryService.listByWorkspaceId(workspace.id);
  }
}
