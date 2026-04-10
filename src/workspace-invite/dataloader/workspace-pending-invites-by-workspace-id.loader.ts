import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';
import { WorkspaceInviteService } from '../workspace-invite.service';

@Injectable({ scope: Scope.REQUEST })
export class WorkspacePendingInvitesByWorkspaceIdLoader extends BaseLoader<
  number,
  WorkspaceInvite[]
> {
  constructor(
    private workspaceInviteService: WorkspaceInviteService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(workspaceIds: number[]): Promise<WorkspaceInvite[][]> {
    const invites =
      await this.workspaceInviteService.listPendingInvitesByWorkspaceIds(workspaceIds);

    const invitesByWorkspaceId = this.groupService.groupBy(invites, 'workspaceId');

    return workspaceIds.map((id) => invitesByWorkspaceId.get(id) || []);
  }
}
