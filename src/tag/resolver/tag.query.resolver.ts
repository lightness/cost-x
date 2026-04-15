import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TagByIdPipe } from '../../common/pipe/tag-by-id.pipe';
import { WorkspaceByIdPipe } from '../../common/pipe/workspace-by-id.pipe';
import { WorkspaceByTagPipe } from '../../common/pipe/workspace-by-tag.pipe';
import { UserRole } from '../../user/entity/user-role.enum';
import { TagsFilter } from '../dto';
import Tag from '../entity/tag.entity';
import { TagService } from '../tag.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
export class TagQueryResolver {
  constructor(private tagService: TagService) {}

  @Query(() => [Tag])
  @Access.allow({
    or: [
      { role: [UserRole.USER], target: 'workspace', targetScope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('workspace', { from: fromArg('workspaceId'), pipes: [WorkspaceByIdPipe] })
  async tags(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { nullable: true }) dto: TagsFilter,
  ): Promise<Tag[]> {
    return this.tagService.listByWorkspaceIds([workspaceId], dto);
  }

  @Query(() => Tag)
  @Access.allow({
    or: [
      { role: [UserRole.USER], target: 'workspace', targetScope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('tag', { from: fromArg('id'), pipes: [TagByIdPipe] })
  @Infer('workspace', { from: 'tag', pipes: [WorkspaceByTagPipe] })
  async tag(@Args('id', { type: () => Int }) id: number): Promise<Tag> {
    return this.tagService.getById(id);
  }
}
