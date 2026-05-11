import { Injectable, Scope } from '@nestjs/common';
import { unique } from '../../common/function/unique';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../../workspace/entity/workspace.entity';

@Injectable({ scope: Scope.REQUEST })
export class WorkspaceByItemIdLoader extends BaseLoader<number, Workspace> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(itemIds: number[]): Promise<Workspace[]> {
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds.filter(unique) } },
    });
    const workspaceIds = items.map((item) => item.workspaceId).filter(unique);
    const workspaces = await this.prisma.workspace.findMany({
      where: { id: { in: workspaceIds } },
    });

    const workspaceById = this.groupService.mapBy(workspaces, 'id');
    const itemById = this.groupService.mapBy(items, 'id');

    return itemIds.map((itemId) => workspaceById.get(itemById.get(itemId)?.workspaceId) || null);
  }
}
