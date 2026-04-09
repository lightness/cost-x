import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { fromReq } from '../../access/function/from-req.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, Permission, PermissionLevel } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import User from '../../user/entity/user.entity';
import { WorkspaceInDto } from '../dto';
import { Workspace } from '../entity/workspace.entity';
import { WorkspaceService } from '../workspace.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class WorkspaceMutationResolver {
  constructor(private workspaceService: WorkspaceService) {}

  @Mutation(() => Workspace)
  @Access.allow([
    {
      and: [
        { targetId: fromReq('user.id'), targetScope: AccessScope.USER },
        { level: PermissionLevel.OWNER, permission: Permission.WORKSPACE_CREATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.WORKSPACE_CREATE },
  ])
  async createWorkspace(
    @Args('dto') dto: WorkspaceInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceService.create(dto, currentUser, tx);
  }

  @Mutation(() => Workspace)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('id'), targetScope: AccessScope.WORKSPACE },
        { level: PermissionLevel.OWNER, permission: Permission.WORKSPACE_UPDATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.WORKSPACE_UPDATE },
  ])
  async updateWorkspace(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto') dto: WorkspaceInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceService.update(id, dto, currentUser, tx);
  }

  @Mutation(() => Workspace)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('id'), targetScope: AccessScope.WORKSPACE },
        { level: PermissionLevel.OWNER, permission: Permission.WORKSPACE_DELETE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.WORKSPACE_DELETE },
  ])
  async deleteWorkspace(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceService.delete(id, currentUser, tx);
  }
}
