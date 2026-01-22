import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import { Workspace } from '../entity/workspace.entity';
import { WorkspacesFilter } from '../dto';
import { WorkspaceService } from '../workspace.service';
import { GroupService } from '../../group/group.service';

@Injectable({ scope: Scope.REQUEST })
export class WorkspacesByUserIdLoader extends NestedLoader<
  number,
  Workspace[],
  WorkspacesFilter
> {
  constructor(
    private workspaceService: WorkspaceService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderWithOptionsFn(
    userIds: number[],
    filter: WorkspacesFilter,
  ): Promise<Workspace[][]> {
    const workspaces = await this.workspaceService.listByOwnerIds(
      userIds,
      filter,
    );

    const workspacesByUserId = this.groupService.groupBy(workspaces, 'ownerId');

    return userIds.map((userId) => workspacesByUserId.get(userId) || []);
  }
}