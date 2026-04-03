import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserByUserIdLoader } from '../../user/dataloader/user-by-user-id.loader';
import { User } from '../../user/entity/user.entity';
import { WorkspaceHistory } from '../entity/workspace-history.entity';
import { WorkspaceHistoryMessageService } from '../workspace-history-message.service';

@Resolver(() => WorkspaceHistory)
export class WorkspaceHistoryFieldResolver {
  constructor(
    private userByUserIdLoader: UserByUserIdLoader,
    private workspaceHistoryMessageService: WorkspaceHistoryMessageService,
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
}
