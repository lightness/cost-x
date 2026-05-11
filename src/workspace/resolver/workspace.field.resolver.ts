import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { WorkspaceHistoryFilter } from '../../workspace-history/dto/workspace-history-filter.type';
import { WorkspaceHistory } from '../../workspace-history/entity/workspace-history.entity';
import { WorkspaceHistoryService } from '../../workspace-history/workspace-history.service';
import { Workspace } from '../entity/workspace.entity';

@Resolver(() => Workspace)
export class WorkspaceFieldResolver {
  constructor(private workspaceHistoryService: WorkspaceHistoryService) {}

  @ResolveField(() => [WorkspaceHistory])
  async history(
    @Parent() workspace: Workspace,
    @Args('workspaceHistoryFilter', { nullable: true })
    filter: WorkspaceHistoryFilter,
  ) {
    return this.workspaceHistoryService.listByWorkspaceId(workspace.id, filter);
  }
}
