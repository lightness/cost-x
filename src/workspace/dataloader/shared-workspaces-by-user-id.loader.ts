import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../entity/workspace.entity';

@Injectable({ scope: Scope.REQUEST })
export class SharedWorkspacesByUserIdLoader extends BaseLoader<number, Workspace[]> {
  constructor(private prisma: PrismaService) {
    super();
  }

  protected async loaderFn(userIds: number[]): Promise<Workspace[][]> {
    const members = await this.prisma.workspaceMember.findMany({
      include: { workspace: true },
      where: { userId: { in: userIds }, leftAt: null },
    });

    const workspacesByUserId = new Map<number, Workspace[]>();

    for (const member of members) {
      const existing = workspacesByUserId.get(member.userId) || [];

      existing.push(member.workspace as Workspace);
      workspacesByUserId.set(member.userId, existing);
    }

    return userIds.map((userId) => workspacesByUserId.get(userId) || []);
  }
}
