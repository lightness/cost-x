import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';
import { WorkspaceMember } from '../entity/workspace-member.entity';
import { WorkspaceInviteService } from '../workspace-invite.service';
import { WorkspaceMemberService } from '../workspace-member.service';

@Resolver(() => Workspace)
export class WorkspaceMembershipFieldResolver {
  constructor(
    private workspaceInviteService: WorkspaceInviteService,
    private workspaceMemberService: WorkspaceMemberService,
  ) {}

  @ResolveField(() => [WorkspaceMember])
  async members(@Parent() workspace: Workspace): Promise<WorkspaceMember[]> {
    return this.workspaceMemberService.listActiveByWorkspaceId(workspace.id);
  }

  @ResolveField(() => [WorkspaceInvite])
  async pendingInvites(@Parent() workspace: Workspace): Promise<WorkspaceInvite[]> {
    return this.workspaceInviteService.listPendingByWorkspaceId(workspace.id);
  }
}
