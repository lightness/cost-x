import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceMember } from '../entity/workspace-member.entity';

@Injectable({ scope: Scope.REQUEST })
export class WorkspaceMembersByWorkspaceIdLoader extends BaseLoader<number, WorkspaceMember[]> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(workspaceIds: number[]): Promise<WorkspaceMember[][]> {
    const members = await this.prisma.workspaceMember.findMany({
      orderBy: { joinedAt: 'asc' },
      where: { removedAt: null, workspaceId: { in: workspaceIds } },
    });

    const membersByWorkspaceId = this.groupService.groupBy(members, 'workspaceId');

    return workspaceIds.map((workspaceId) => membersByWorkspaceId.get(workspaceId) || []);
  }
}
