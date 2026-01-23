import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import { GroupService } from '../../group/group.service';
import { TagsFilter } from '../dto';
import Tag from '../entities/tag.entity';
import { TagService } from '../tag.service';

@Injectable({ scope: Scope.REQUEST })
export class TagsByWorkspaceIdLoader extends NestedLoader<
  number,
  Tag[],
  TagsFilter
> {
  constructor(
    private tagService: TagService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderWithOptionsFn(
    workspaceIds: number[],
    filter: TagsFilter,
  ): Promise<Tag[][]> {
    const tags = await this.tagService.listByWorkspaceIds(workspaceIds, filter);

    const tagsByWorkspaceId = this.groupService.groupBy(tags, 'workspaceId');

    return workspaceIds.map(
      (workspaceId) => tagsByWorkspaceId.get(workspaceId) || [],
    );
  }
}
