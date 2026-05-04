import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, WorkspacePermission } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { WorkspaceMember } from '../entity/workspace-member.entity';
import { WorkspaceByWorkspaceMemberPipe } from '../pipe/workspace-by-workspace-member.pipe';
import { WorkspaceMemberByIdPipe } from '../pipe/workspace-member-by-id.pipe';
import { WorkspaceMemberPermissionService } from '../workspace-member-permission.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class WorkspaceMemberPermissionMutationResolver {
  constructor(private permissionService: WorkspaceMemberPermissionService) {}

  @Mutation(() => Boolean)
  @Access.allow({
    or: [
      { owner: 'workspace', scope: AccessScope.WORKSPACE },
      {
        permission: WorkspacePermission.GRANT_WORKSPACE_PERMISSION,
        scope: AccessScope.WORKSPACE,
        target: 'workspace',
      },
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
    ],
  })
  @Infer('member', { from: fromArg('memberId'), pipes: [WorkspaceMemberByIdPipe] })
  @Infer('workspace', { from: 'member', pipes: [WorkspaceByWorkspaceMemberPipe] })
  async grantWorkspaceMemberPermissions(
    @Args('memberId', { type: () => Int }, WorkspaceMemberByIdPipe) member: WorkspaceMember,
    @Args('permissions', { type: () => [WorkspacePermission] }) permissions: WorkspacePermission[],
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ): Promise<boolean> {
    await this.permissionService.grantPermissions(member, permissions, currentUser, tx);

    return true;
  }

  @Mutation(() => Boolean)
  @Access.allow({
    or: [
      { owner: 'workspace', scope: AccessScope.WORKSPACE },
      {
        permission: WorkspacePermission.REVOKE_WORKSPACE_PERMISSION,
        scope: AccessScope.WORKSPACE,
        target: 'workspace',
      },
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
    ],
  })
  @Infer('member', { from: fromArg('memberId'), pipes: [WorkspaceMemberByIdPipe] })
  @Infer('workspace', { from: 'member', pipes: [WorkspaceByWorkspaceMemberPipe] })
  async revokeWorkspaceMemberPermissions(
    @Args('memberId', { type: () => Int }, WorkspaceMemberByIdPipe) member: WorkspaceMember,
    @Args('permissions', { type: () => [WorkspacePermission] }) permissions: WorkspacePermission[],
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ): Promise<boolean> {
    await this.permissionService.revokePermissions(member, permissions, currentUser, tx);

    return true;
  }
}
