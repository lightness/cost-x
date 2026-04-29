import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { WorkspaceMember } from '../entity/workspace-member.entity';

@Injectable()
export class WorkspaceByWorkspaceMemberPipe
  implements PipeTransform<WorkspaceMember, Promise<Workspace>>
{
  constructor(private prisma: PrismaService) {}

  async transform(member: WorkspaceMember): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: member.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace #${member.workspaceId} not found`);
    }

    return workspace;
  }
}
