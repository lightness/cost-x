import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';

@Injectable()
export class WorkspaceByWorkspaceInvitePipe
  implements PipeTransform<WorkspaceInvite, Promise<Workspace>>
{
  constructor(private prisma: PrismaService) {}

  async transform(invite: WorkspaceInvite): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: invite.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace #${invite.workspaceId} not found`);
    }

    return workspace;
  }
}
