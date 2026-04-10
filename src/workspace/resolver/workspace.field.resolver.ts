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
import { WorkspaceHistoryFilter } from '../../workspace-history/dto/workspace-history-filter.type';
import { WorkspaceHistory } from '../../workspace-history/entity/workspace-history.entity';
import { WorkspaceHistoryService } from '../../workspace-history/workspace-history.service';
import { WorkspaceMembersByWorkspaceIdLoader } from '../../workspace-invite/dataloader/workspace-members-by-workspace-id.loader';
import { WorkspacePendingInvitesByWorkspaceIdLoader } from '../../workspace-invite/dataloader/workspace-pending-invites-by-workspace-id.loader';
import { WorkspaceInvite } from '../../workspace-invite/entity/workspace-invite.entity';
import { WorkspaceMember } from '../../workspace-invite/entity/workspace-member.entity';
import { Workspace } from '../entity/workspace.entity';

@Resolver(() => Workspace)
export class WorkspaceFieldResolver {
  constructor(
    private itemsByWorkspaceLoader: ItemsByWorkspaceIdLoader,
    private tagsByWorkspaceIdLoader: TagsByWorkspaceIdLoader,
    private itemsAggregationsByWorkspaceIdLoader: ItemsAggregationsByWorkspaceIdLoader,
    private workspaceHistoryService: WorkspaceHistoryService,
    private workspaceMembersByWorkspaceIdLoader: WorkspaceMembersByWorkspaceIdLoader,
    private workspacePendingInvitesByWorkspaceIdLoader: WorkspacePendingInvitesByWorkspaceIdLoader,
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
  async history(
    @Parent() workspace: Workspace,
    @Args('workspaceHistoryFilter', { nullable: true })
    filter: WorkspaceHistoryFilter,
  ) {
    return this.workspaceHistoryService.listByWorkspaceId(workspace.id, filter);
  }

  @ResolveField(() => [WorkspaceMember])
  async members(@Parent() workspace: Workspace) {
    return this.workspaceMembersByWorkspaceIdLoader.load(workspace.id);
  }

  @ResolveField(() => [WorkspaceInvite])
  async pendingInvites(@Parent() workspace: Workspace) {
    return this.workspacePendingInvitesByWorkspaceIdLoader.load(workspace.id);
  }
}
