import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { TagsByWorkspaceIdLoader } from '../dataloader/tags-by-workspace-id.loader.service';
import { TagsFilter } from '../dto';
import Tag from '../entity/tag.entity';

@Resolver(() => Workspace)
export class WorkspaceTagsFieldResolver {
  constructor(private tagsByWorkspaceIdLoader: TagsByWorkspaceIdLoader) {}

  @ResolveField(() => [Tag])
  async tags(
    @Parent() workspace: Workspace,
    @Args('tagsFilter', { nullable: true }) tagsFilter: TagsFilter,
  ) {
    return this.tagsByWorkspaceIdLoader.withOptions(tagsFilter).load(workspace.id);
  }
}
