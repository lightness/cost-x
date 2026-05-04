import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Tag from '../../tag/entity/tag.entity';
import { Workspace } from '../../workspace/entity/workspace.entity';

@Injectable()
export class WorkspaceByTagPipe implements PipeTransform<Tag, Promise<Workspace>> {
  constructor(private prisma: PrismaService) {}

  async transform(tag: Tag): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: tag.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace #${tag.workspaceId} not found`);
    }

    return workspace;
  }
}
