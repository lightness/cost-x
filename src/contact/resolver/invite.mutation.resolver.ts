import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, Permission, PermissionLevel } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import User from '../../user/entity/user.entity';
import { CreateInviteByEmailInDto, CreateInviteInDto } from '../dto';
import { EmailInviteService } from '../email-invite.service';
import { Invite } from '../entity/invite.entity';
import { InviteValidationService } from '../invite-validation.service';
import { InviteService } from '../invite.service';

@Resolver()
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
@UseGuards(AuthGuard, AccessGuard)
export class InviteMutationResolver {
  constructor(
    private inviteService: InviteService,
    private inviteValidationService: InviteValidationService,
    private emailInviteService: EmailInviteService,
  ) {}

  @Mutation(() => Invite)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('dto.inviterUserId'), targetScope: AccessScope.USER },
        { level: PermissionLevel.OWNER, permission: Permission.INVITE_CREATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.INVITE_CREATE },
  ])
  async createInviteByEmail(
    @Args('dto') dto: CreateInviteByEmailInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.emailInviteService.createInviteByEmail(dto, tx);
  }

  @Mutation(() => Invite)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('dto.inviterUserId'), targetScope: AccessScope.USER },
        { level: PermissionLevel.OWNER, permission: Permission.INVITE_CREATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.INVITE_CREATE },
  ])
  async createInvite(
    @Args('dto') dto: CreateInviteInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    const { inviteeUserId, inviterUserId } = dto;

    await this.inviteValidationService.validateCreateInvite(inviterUserId, inviteeUserId, tx);

    return this.inviteService.createInvite(inviterUserId, inviteeUserId, tx);
  }

  @Mutation(() => Invite)
  @Access.allow([
    {
      and: [
        {
          metadata: { as: 'invitee' },
          targetId: fromArg('inviteId'),
          targetScope: AccessScope.INVITE,
        },
        { level: PermissionLevel.OWNER, permission: Permission.INVITE_ACCEPT },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.INVITE_ACCEPT },
  ])
  async acceptInvite(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.inviteValidationService.validateAcceptInvite(inviteId, tx);

    return this.inviteService.acceptInvite(inviteId, tx);
  }

  @Mutation(() => Invite)
  @Access.allow([
    {
      and: [
        {
          metadata: { as: 'invitee' },
          targetId: fromArg('inviteId'),
          targetScope: AccessScope.INVITE,
        },
        { level: PermissionLevel.OWNER, permission: Permission.INVITE_REJECT },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.INVITE_REJECT },
  ])
  async rejectInvite(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.inviteValidationService.validateRejectInvite(inviteId, tx);

    return this.inviteService.rejectInvite(inviteId, tx);
  }

  @Mutation(() => Invite)
  @Access.allow([
    {
      and: [
        {
          metadata: { as: 'invitee' },
          targetId: fromArg('inviteId'),
          targetScope: AccessScope.INVITE,
        },
        { level: PermissionLevel.OWNER, permission: Permission.INVITE_REJECT },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.INVITE_REJECT },
  ])
  async rejectInviteAndBlockUser(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @Context('tx') tx: Prisma.TransactionClient,
    @CurrentUser() currentUser: User,
  ) {
    await this.inviteValidationService.validateRejectInviteAndBlockUser(inviteId, tx);

    return this.inviteService.rejectInviteAndBlockUser(inviteId, currentUser.id, tx);
  }
}
