import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloader/nested.loader';
import { GroupService } from '../../group/group.service';
import { InvitesFilter } from '../dto/invite-filter.type';
import { Invite } from '../entity/invite.entity';
import { InviteService } from '../invite.service';

@Injectable({ scope: Scope.REQUEST })
export class OutgoingInvitesByUserIdLoader extends NestedLoader<number, Invite[], InvitesFilter> {
  constructor(
    private inviteService: InviteService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderWithOptionsFn(
    userIds: number[],
    filter: InvitesFilter,
  ): Promise<Invite[][]> {
    const invites = await this.inviteService.listByInviterUserIds(userIds, filter);

    const invitesByInviterId = this.groupService.groupBy(invites, 'inviterId');

    return userIds.map((userId) => invitesByInviterId.get(userId) || []);
  }
}
