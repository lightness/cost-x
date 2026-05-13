import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { WorkspaceMembersByWorkspaceIdLoader } from '../dataloader/workspace-members-by-workspace-id.loader.service';
import { WorkspaceMember } from '../entity/workspace-member.entity';

@Resolver(() => Workspace)
export class WorkspaceMembersFieldResolver {
  constructor(private workspaceMembersByWorkspaceIdLoader: WorkspaceMembersByWorkspaceIdLoader) {}

  @ResolveField(() => [WorkspaceMember])
  async members(@Parent() workspace: Workspace): Promise<WorkspaceMember[]> {
    return this.workspaceMembersByWorkspaceIdLoader.load(workspace.id);
  }
}
