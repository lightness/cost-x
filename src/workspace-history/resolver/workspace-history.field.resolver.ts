import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { UserByUserIdLoader } from '../../user/dataloader/user-by-user-id.loader';
import User from '../../user/entity/user.entity';
import { ChangesService } from '../changes.service';
import { WorkspaceHistory } from '../entity/workspace-history.entity';
import { WorkspaceHistoryMessageService } from '../workspace-history-message.service';

@Resolver(() => WorkspaceHistory)
export class WorkspaceHistoryFieldResolver {
  constructor(
    private userByUserIdLoader: UserByUserIdLoader,
    private workspaceHistoryMessageService: WorkspaceHistoryMessageService,
    private changesService: ChangesService,
  ) {}

  @ResolveField(() => User)
  async actor(@Parent() workspaceHistory: WorkspaceHistory) {
    return this.userByUserIdLoader.load(workspaceHistory.actorId);
  }

  @ResolveField(() => String)
  async message(@Parent() workspaceHistory: WorkspaceHistory): Promise<string> {
    const actor = await this.userByUserIdLoader.load(workspaceHistory.actorId);

    return this.workspaceHistoryMessageService.build(workspaceHistory, actor.name);
  }

  @ResolveField(() => GraphQLJSON)
  async changes(
    @Parent() workspaceHistory: WorkspaceHistory,
  ): Promise<Record<string, { oldValue: unknown; newValue: unknown }>> {
    const changes = this.changesService.getDiffByWorkspaceHistory(workspaceHistory);

    return changes;
  }
}
