import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';

@Injectable({ scope: Scope.REQUEST })
export class WorkspaceInviteByInviteIdLoader extends BaseLoader<number, WorkspaceInvite> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(inviteIds: number[]): Promise<WorkspaceInvite[]> {
    const invites = await this.prisma.workspaceInvite.findMany({
      where: { id: { in: inviteIds } },
    });

    return this.groupService.sortBy(invites, 'id', inviteIds);
  }
}
