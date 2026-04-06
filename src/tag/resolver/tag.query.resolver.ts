import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { UserRole } from '../../user/entity/user-role.enum';
import { TagsFilter } from '../dto';
import Tag from '../entity/tag.entity';
import { TagService } from '../tag.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
export class TagQueryResolver {
  constructor(private tagService: TagService) {}

  @Query(() => [Tag])
  @Access.allow([
    {
      role: [UserRole.USER],
      targetId: fromArg('workspaceId'),
      targetScope: AccessScope.WORKSPACE,
    },
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
  ])
  async tags(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { nullable: true }) dto: TagsFilter,
  ): Promise<Tag[]> {
    return this.tagService.listByWorkspaceIds([workspaceId], dto);
  }

  @Query(() => Tag)
  @Access.allow([
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.TAG,
    },
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
  ])
  async tag(@Args('id', { type: () => Int }) id: number): Promise<Tag> {
    return this.tagService.getById(id);
  }
}
