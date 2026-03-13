import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Invite } from '../entity/invite.entity';

@Injectable({ scope: Scope.REQUEST })
export class InviteByInviteIdLoader extends BaseLoader<number, Invite> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(inviteIds: number[]): Promise<Invite[]> {
    const invites = await this.prisma.invite.findMany({
      where: {
        id: { in: inviteIds },
      },
    });

    return this.groupService.sortBy(invites, 'id', inviteIds);
  }
}
