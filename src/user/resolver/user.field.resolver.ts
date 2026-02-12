import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { WorkspacesByUserIdLoader } from '../../workspace/dataloader/workspaces-by-user-id.loader';
import { WorkspacesFilter } from '../../workspace/dto';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { User } from '../entity/user.entity';

@Resolver(() => User)
export class UserFieldResolver {
  constructor(private workspacesByUserIdLoader: WorkspacesByUserIdLoader) {}

  @ResolveField(() => [Workspace])
  async workspaces(
    @Parent() user: User,
    @Args('workspacesFilter', { nullable: true }) filters: WorkspacesFilter,
  ) {
    const userWorkspaces = this.workspacesByUserIdLoader
      .withOptions(filters)
      .load(user.id);

    return userWorkspaces;
  }
}
