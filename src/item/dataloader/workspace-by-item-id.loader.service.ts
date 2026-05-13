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
      include: { workspace: true },
      where: { id: { in: itemIds.filter(unique) } },
    });

    const itemById = this.groupService.mapBy(items, 'id');

    return itemIds.map((itemId) => itemById.get(itemId)?.workspace ?? null);
  }
}
