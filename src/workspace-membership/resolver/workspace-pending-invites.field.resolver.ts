import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { WorkspaceInvitesByWorkspaceIdLoader } from '../dataloader/workspace-invites-by-workspace-id.loader.service';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';

@Resolver(() => Workspace)
export class WorkspacePendingInvitesFieldResolver {
  constructor(private workspaceInvitesByWorkspaceIdLoader: WorkspaceInvitesByWorkspaceIdLoader) {}

  @ResolveField(() => [WorkspaceInvite])
  async pendingInvites(@Parent() workspace: Workspace): Promise<WorkspaceInvite[]> {
    return this.workspaceInvitesByWorkspaceIdLoader.load(workspace.id);
  }
}
