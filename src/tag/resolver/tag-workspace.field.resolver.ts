import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { WorkspaceByTagIdLoader } from '../dataloader/workspace-by-tag-id.loader.service';
import Tag from '../entity/tag.entity';

@Resolver(() => Tag)
export class TagWorkspaceFieldResolver {
  constructor(private workspaceByTagIdLoader: WorkspaceByTagIdLoader) {}

  @ResolveField(() => Workspace)
  async workspace(@Parent() tag: Tag) {
    return this.workspaceByTagIdLoader.load(tag.id);
  }
}
