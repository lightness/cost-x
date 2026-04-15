import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { UserByIdPipe } from '../../common/pipe/user-by-id.pipe';
import { WorkspaceByIdPipe } from '../../common/pipe/workspace-by-id.pipe';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { CreateWorkspaceInviteInDto } from '../dto/create-workspace-invite.in.dto';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';
import { InviteeByWorkspaceInvitePipe } from '../pipe/invitee-by-workspace-invite.pipe';
import { WorkspaceByWorkspaceInvitePipe } from '../pipe/workspace-by-workspace-invite.pipe';
import { WorkspaceInviteByIdPipe } from '../pipe/workspace-invite-by-id.pipe';
import { WorkspaceInviteService } from '../workspace-invite.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class WorkspaceInviteMutationResolver {
  constructor(private workspaceInviteService: WorkspaceInviteService) {}

  @Mutation(() => WorkspaceInvite)
  @Access.allow({
    or: [
      { role: [UserRole.USER], target: 'workspace', targetScope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('workspace', { from: fromArg('dto.workspaceId'), pipes: [WorkspaceByIdPipe] })
  async createWorkspaceInvite(
    @Args('dto') _: CreateWorkspaceInviteInDto,
    @DeepArgs('dto.workspaceId', WorkspaceByIdPipe) workspace: Workspace,
    @DeepArgs('dto.inviteeId', UserByIdPipe) invitee: User,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceInviteService.createInvite(workspace, currentUser, invitee, tx);
  }

  @Mutation(() => WorkspaceInvite)
  @Access.allow({
    or: [
      { role: [UserRole.USER], target: 'inviteeUser', targetScope: AccessScope.USER },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('invite', { from: fromArg('inviteId'), pipes: [WorkspaceInviteByIdPipe] })
  @Infer('inviteeUser', { from: 'invite', pipes: [InviteeByWorkspaceInvitePipe] })
  async acceptWorkspaceInvite(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceInviteService.acceptInvite(inviteId, currentUser.id, tx);
  }

  @Mutation(() => WorkspaceInvite)
  @Access.allow({
    or: [
      { role: [UserRole.USER], target: 'inviteeUser', targetScope: AccessScope.USER },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('invite', { from: fromArg('inviteId'), pipes: [WorkspaceInviteByIdPipe] })
  @Infer('inviteeUser', { from: 'invite', pipes: [InviteeByWorkspaceInvitePipe] })
  async rejectWorkspaceInvite(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceInviteService.rejectInvite(inviteId, tx);
  }

  @Mutation(() => WorkspaceInvite)
  @Access.allow({
    or: [
      { role: [UserRole.USER], target: 'workspace', targetScope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('invite', { from: fromArg('inviteId'), pipes: [WorkspaceInviteByIdPipe] })
  @Infer('workspace', { from: 'invite', pipes: [WorkspaceByWorkspaceInvitePipe] })
  async cancelWorkspaceInvite(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceInviteService.cancelInvite(inviteId, tx);
  }
}
