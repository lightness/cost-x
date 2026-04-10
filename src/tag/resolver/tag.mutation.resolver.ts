import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel, WorkspaceRole } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { Permission } from '../../access/entity/permission.enum';
import User from '../../user/entity/user.entity';
import { TagInDto } from '../dto';
import Tag from '../entity/tag.entity';
import { TagService } from '../tag.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
export class TagMutationResolver {
  constructor(private tagService: TagService) {}

  @Mutation(() => Tag)
  @Access.allow([
    { targetId: fromArg('workspaceId'), targetScope: AccessScope.WORKSPACE, workspaceRole: WorkspaceRole.OWNER },
    { targetId: fromArg('workspaceId'), targetScope: AccessScope.WORKSPACE, workspaceRole: WorkspaceRole.MEMBER, permission: Permission.TAG_CREATE },
    { level: PermissionLevel.ADMIN, permission: Permission.TAG_CREATE },
  ])
  async createTag(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { type: () => TagInDto }) dto: TagInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.tagService.create(workspaceId, dto, currentUser, tx);
  }

  @Mutation(() => Tag)
  @Access.allow([
    { targetId: fromArg('id'), targetScope: AccessScope.TAG, workspaceRole: WorkspaceRole.OWNER },
    { targetId: fromArg('id'), targetScope: AccessScope.TAG, workspaceRole: WorkspaceRole.MEMBER, permission: Permission.TAG_UPDATE },
    { level: PermissionLevel.ADMIN, permission: Permission.TAG_UPDATE },
  ])
  async updateTag(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => TagInDto }) dto: TagInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.tagService.update(id, dto, currentUser, tx);
  }

  @Mutation(() => Boolean)
  @Access.allow([
    { targetId: fromArg('id'), targetScope: AccessScope.TAG, workspaceRole: WorkspaceRole.OWNER },
    { targetId: fromArg('id'), targetScope: AccessScope.TAG, workspaceRole: WorkspaceRole.MEMBER, permission: Permission.TAG_DELETE },
    { level: PermissionLevel.ADMIN, permission: Permission.TAG_DELETE },
  ])
  async deleteTag(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.tagService.delete(id, currentUser, tx);

    return true;
  }
}
