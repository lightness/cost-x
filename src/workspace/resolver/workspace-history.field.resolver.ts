import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { WorkspaceHistoriesByWorkspaceIdLoader } from '../../workspace-history/dataloader/workspace-histories-by-workspace-id.loader.service';
import { WorkspaceHistoryFilter } from '../../workspace-history/dto/workspace-history-filter.type';
import { WorkspaceHistory } from '../../workspace-history/entity/workspace-history.entity';
import { Workspace } from '../entity/workspace.entity';

@Resolver(() => Workspace)
export class WorkspaceHistoryFieldResolver {
  constructor(
    private workspaceHistoriesByWorkspaceIdLoader: WorkspaceHistoriesByWorkspaceIdLoader,
  ) {}

  @ResolveField(() => [WorkspaceHistory])
  async history(
    @Parent() workspace: Workspace,
    @Args('workspaceHistoryFilter', { nullable: true }) filter: WorkspaceHistoryFilter,
  ) {
    return this.workspaceHistoriesByWorkspaceIdLoader.withOptions(filter || {}).load(workspace.id);
  }
}
