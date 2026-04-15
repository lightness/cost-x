import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';
import { WorkspaceMember } from '../entity/workspace-member.entity';
import { WorkspaceInviteService } from '../workspace-invite.service';

@Resolver(() => Workspace)
export class WorkspaceMembershipFieldResolver {
  constructor(private workspaceInviteService: WorkspaceInviteService) {}

  @ResolveField(() => [WorkspaceMember])
  async members(@Parent() workspace: Workspace): Promise<WorkspaceMember[]> {
    return this.workspaceInviteService.listMembersByWorkspaceId(workspace.id);
  }

  @ResolveField(() => [WorkspaceInvite])
  async pendingInvites(@Parent() workspace: Workspace): Promise<WorkspaceInvite[]> {
    return this.workspaceInviteService.listByWorkspaceId(workspace.id);
  }
}
