import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserByUserIdLoader } from '../../user/dataloader/user-by-user-id.loader';
import { User } from '../../user/entity/user.entity';
import { WorkspaceHistory } from '../entity/workspace-history.entity';

@Resolver(() => WorkspaceHistory)
export class WorkspaceHistoryFieldResolver {
  constructor(private userByUserIdLoader: UserByUserIdLoader) {}

  @ResolveField(() => User)
  async actor(@Parent() workspaceHistory: WorkspaceHistory) {
    return this.userByUserIdLoader.load(workspaceHistory.actorId);
  }
}
