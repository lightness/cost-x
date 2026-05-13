import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloader/nested.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceHistoryFilter } from '../dto/workspace-history-filter.type';
import { WorkspaceHistory } from '../entity/workspace-history.entity';

@Injectable({ scope: Scope.REQUEST })
export class WorkspaceHistoriesByWorkspaceIdLoader extends NestedLoader<
  number,
  WorkspaceHistory[],
  WorkspaceHistoryFilter
> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderWithOptionsFn(
    workspaceIds: number[],
    filter: WorkspaceHistoryFilter,
  ): Promise<WorkspaceHistory[][]> {
    const entries = await this.prisma.workspaceHistory.findMany({
      orderBy: { createdAt: 'desc' },
      where: { id: filter.id, workspaceId: { in: workspaceIds } },
    });

    const entriesByWorkspaceId = this.groupService.groupBy(entries, 'workspaceId');

    return workspaceIds.map((workspaceId) => entriesByWorkspaceId.get(workspaceId) || []);
  }
}
