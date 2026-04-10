import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel, WorkspaceRole } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Permission } from '../../access/entity/permission.enum';
import { TagsFilter } from '../dto';
import Tag from '../entity/tag.entity';
import { TagService } from '../tag.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
export class TagQueryResolver {
  constructor(private tagService: TagService) {}

  @Query(() => [Tag])
  @Access.allow([
    { targetId: fromArg('workspaceId'), targetScope: AccessScope.WORKSPACE, workspaceRole: WorkspaceRole.OWNER },
    { targetId: fromArg('workspaceId'), targetScope: AccessScope.WORKSPACE, workspaceRole: WorkspaceRole.MEMBER, permission: Permission.WORKSPACE_READ },
    { level: PermissionLevel.ADMIN, permission: Permission.WORKSPACE_READ },
  ])
  async tags(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { nullable: true }) dto: TagsFilter,
  ): Promise<Tag[]> {
    return this.tagService.listByWorkspaceIds([workspaceId], dto);
  }

  @Query(() => Tag)
  @Access.allow([
    { targetId: fromArg('id'), targetScope: AccessScope.TAG, workspaceRole: WorkspaceRole.OWNER },
    { targetId: fromArg('id'), targetScope: AccessScope.TAG, workspaceRole: WorkspaceRole.MEMBER, permission: Permission.WORKSPACE_READ },
    { level: PermissionLevel.ADMIN, permission: Permission.WORKSPACE_READ },
  ])
  async tag(@Args('id', { type: () => Int }) id: number): Promise<Tag> {
    return this.tagService.getById(id);
  }
}
