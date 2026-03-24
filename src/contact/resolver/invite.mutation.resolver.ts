import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserRole } from '../../user/entity/user-role.enum';
import { CreateInviteInDto } from '../dto';
import { Invite } from '../entity/invite.entity';
import { InviteValidationService } from '../invite-validation.service';
import { InviteService } from '../invite.service';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { User } from '../../user/entity/user.entity';

@Resolver()
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
@UseGuards(AuthGuard, AccessGuard)
export class InviteMutationResolver {
  constructor(
    private inviteService: InviteService,
    private inviteValidationService: InviteValidationService,
  ) {}

  @Mutation(() => Invite)
  @Access.allow([
    {
      role: UserRole.USER,
      targetId: fromArg('dto.inviterUserId'),
      targetScope: AccessScope.USER,
    },
    { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
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
      metadata: { as: 'invitee' },
      role: UserRole.USER,
      targetId: fromArg('inviteId'),
      targetScope: AccessScope.INVITE,
    },
    { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
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
      metadata: { as: 'invitee' },
      role: UserRole.USER,
      targetId: fromArg('inviteId'),
      targetScope: AccessScope.INVITE,
    },
    { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
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
      metadata: { as: 'invitee' },
      role: UserRole.USER,
      targetId: fromArg('inviteId'),
      targetScope: AccessScope.INVITE,
    },
    { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
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
