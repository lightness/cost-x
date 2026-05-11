import { Injectable, Scope } from '@nestjs/common';
import { WorkspaceInviteStatus } from '../../../generated/prisma/client';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';

@Injectable({ scope: Scope.REQUEST })
export class WorkspaceInvitesByWorkspaceIdLoader extends BaseLoader<number, WorkspaceInvite[]> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(workspaceIds: number[]): Promise<WorkspaceInvite[][]> {
    const invites = await this.prisma.workspaceInvite.findMany({
      orderBy: { createdAt: 'desc' },
      where: { status: WorkspaceInviteStatus.PENDING, workspaceId: { in: workspaceIds } },
    });

    const invitesByWorkspaceId = this.groupService.groupBy(invites, 'workspaceId');

    return workspaceIds.map((workspaceId) => invitesByWorkspaceId.get(workspaceId) || []);
  }
}
