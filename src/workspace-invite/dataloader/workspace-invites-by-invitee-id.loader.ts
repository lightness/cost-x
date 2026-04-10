import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloader/nested.loader';
import { GroupService } from '../../group/group.service';
import { WorkspaceInviteStatus } from '../entity/workspace-invite-status.enum';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';
import { WorkspaceInviteService } from '../workspace-invite.service';

export interface WorkspaceInvitesByInviteeIdOptions {
  status: WorkspaceInviteStatus;
}

@Injectable({ scope: Scope.REQUEST })
export class WorkspaceInvitesByInviteeIdLoader extends NestedLoader<
  number,
  WorkspaceInvite[],
  WorkspaceInvitesByInviteeIdOptions
> {
  constructor(
    private workspaceInviteService: WorkspaceInviteService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderWithOptionsFn(
    inviteeUserIds: number[],
    options: WorkspaceInvitesByInviteeIdOptions,
  ): Promise<WorkspaceInvite[][]> {
    const invites = await this.workspaceInviteService.listInvitesByInviteeUserIds(
      inviteeUserIds,
      options.status,
    );

    const invitesByInviteeId = this.groupService.groupBy(invites, 'inviteeId');

    return inviteeUserIds.map((id) => invitesByInviteeId.get(id) || []);
  }
}
