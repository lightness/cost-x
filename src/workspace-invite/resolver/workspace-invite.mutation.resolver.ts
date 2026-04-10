import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { fromReq } from '../../access/function/from-req.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel } from '../../access/interfaces';
import { Permission } from '../../access/entity/permission.enum';import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import User from '../../user/entity/user.entity';
import { CreateWorkspaceInviteInDto } from '../dto';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';
import { WorkspaceMember } from '../entity/workspace-member.entity';
import { WorkspaceInviteValidationService } from '../workspace-invite-validation.service';
import { WorkspaceInviteService } from '../workspace-invite.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
export class WorkspaceInviteMutationResolver {
  constructor(
    private workspaceInviteService: WorkspaceInviteService,
    private workspaceInviteValidationService: WorkspaceInviteValidationService,
  ) {}

  @Mutation(() => WorkspaceInvite)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('dto.workspaceId'), targetScope: AccessScope.WORKSPACE },
        { level: PermissionLevel.OWNER, permission: Permission.WORKSPACE_INVITE_CREATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.WORKSPACE_INVITE_CREATE },
  ])
  async createWorkspaceInvite(
    @Args('dto') dto: CreateWorkspaceInviteInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.workspaceInviteValidationService.validateCreateInvite(
      currentUser.id,
      dto.workspaceId,
      dto.inviteeUserId,
      tx,
    );

    return this.workspaceInviteService.createInvite(
      currentUser.id,
      dto.workspaceId,
      dto.inviteeUserId,
      dto.permissions,
      tx,
    );
  }

  @Mutation(() => WorkspaceInvite)
  @Access.allow([
    {
      and: [
        {
          metadata: { as: 'invitee' },
          targetId: fromArg('inviteId'),
          targetScope: AccessScope.WORKSPACE_MEMBER,
        },
        { level: PermissionLevel.OWNER, permission: Permission.WORKSPACE_INVITE_ACCEPT },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.WORKSPACE_INVITE_ACCEPT },
  ])
  async acceptWorkspaceInvite(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.workspaceInviteValidationService.validateAcceptInvite(inviteId, tx);

    return this.workspaceInviteService.acceptInvite(inviteId, currentUser.id, tx);
  }

  @Mutation(() => WorkspaceInvite)
  @Access.allow([
    {
      and: [
        {
          metadata: { as: 'invitee' },
          targetId: fromArg('inviteId'),
          targetScope: AccessScope.WORKSPACE_MEMBER,
        },
        { level: PermissionLevel.OWNER, permission: Permission.WORKSPACE_INVITE_REJECT },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.WORKSPACE_INVITE_REJECT },
  ])
  async rejectWorkspaceInvite(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.workspaceInviteValidationService.validateRejectInvite(inviteId, tx);

    return this.workspaceInviteService.rejectInvite(inviteId, tx);
  }

  @Mutation(() => WorkspaceMember)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('workspaceId'), targetScope: AccessScope.WORKSPACE },
        { level: PermissionLevel.OWNER, permission: Permission.WORKSPACE_MEMBER_REMOVE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.WORKSPACE_MEMBER_REMOVE },
  ])
  async removeWorkspaceMember(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('userId', { type: () => Int }) userId: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.workspaceInviteValidationService.validateRemoveMember(workspaceId, userId, tx);

    return this.workspaceInviteService.removeMember(workspaceId, userId, currentUser.id, tx);
  }
}
