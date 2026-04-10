import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { WorkspaceMember } from '../entity/workspace-member.entity';
import { WorkspaceInviteService } from '../workspace-invite.service';

@Injectable({ scope: Scope.REQUEST })
export class WorkspaceMembersByWorkspaceIdLoader extends BaseLoader<number, WorkspaceMember[]> {
  constructor(
    private workspaceInviteService: WorkspaceInviteService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(workspaceIds: number[]): Promise<WorkspaceMember[][]> {
    const members = await this.workspaceInviteService.listMembersByWorkspaceIds(workspaceIds);

    const membersByWorkspaceId = this.groupService.groupBy(members, 'workspaceId');

    return workspaceIds.map((id) => membersByWorkspaceId.get(id) || []);
  }
}
