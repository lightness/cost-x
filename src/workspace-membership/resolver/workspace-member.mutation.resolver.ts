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
import { UserByWorkspaceMemberPipe } from '../pipe/user-by-workspace-member.pipe';
import { WorkspaceByWorkspaceMemberPipe } from '../pipe/workspace-by-workspace-member.pipe';
import { WorkspaceMemberByIdPipe } from '../pipe/workspace-member-by-id.pipe';
import { WorkspaceMemberService } from '../workspace-member.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class WorkspaceMemberMutationResolver {
  constructor(private workspaceMemberService: WorkspaceMemberService) {}

  @Mutation(() => WorkspaceMember)
  @Access.allow({
    or: [{ self: 'memberUser' }, { role: [UserRole.ADMIN], scope: AccessScope.USER }],
  })
  @Infer('member', { from: fromArg('memberId'), pipes: [WorkspaceMemberByIdPipe] })
  @Infer('memberUser', { from: 'member', pipes: [UserByWorkspaceMemberPipe] })
  async leaveWorkspace(
    @Args('memberId', { type: () => Int }, WorkspaceMemberByIdPipe) member: WorkspaceMember,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ): Promise<WorkspaceMember> {
    return this.workspaceMemberService.remove(member, currentUser.id, tx);
  }

  @Mutation(() => WorkspaceMember)
  @Access.allow({
    or: [
      { owner: 'workspace', scope: AccessScope.WORKSPACE },
      {
        permission: WorkspacePermission.REMOVE_WORKSPACE_MEMBER,
        scope: AccessScope.WORKSPACE,
        target: 'workspace',
      },
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
    ],
  })
  @Infer('member', { from: fromArg('memberId'), pipes: [WorkspaceMemberByIdPipe] })
  @Infer('workspace', { from: 'member', pipes: [WorkspaceByWorkspaceMemberPipe] })
  async removeWorkspaceMember(
    @Args('memberId', { type: () => Int }, WorkspaceMemberByIdPipe) member: WorkspaceMember,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ): Promise<WorkspaceMember> {
    return this.workspaceMemberService.remove(member, currentUser.id, tx);
  }
}
