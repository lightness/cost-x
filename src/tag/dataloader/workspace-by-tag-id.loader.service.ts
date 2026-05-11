import { Injectable, Scope } from '@nestjs/common';
import { unique } from '../../common/function/unique';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../../workspace/entity/workspace.entity';

@Injectable({ scope: Scope.REQUEST })
export class WorkspaceByTagIdLoader extends BaseLoader<number, Workspace> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(tagIds: number[]): Promise<Workspace[]> {
    const tags = await this.prisma.tag.findMany({ where: { id: { in: tagIds.filter(unique) } } });
    const workspaceIds = tags.map((tag) => tag.workspaceId).filter(unique);
    const workspaces = await this.prisma.workspace.findMany({
      where: { id: { in: workspaceIds } },
    });

    const workspaceById = this.groupService.mapBy(workspaces, 'id');
    const tagById = this.groupService.mapBy(tags, 'id');

    return tagIds.map((tagId) => workspaceById.get(tagById.get(tagId)?.workspaceId) || null);
  }
}
