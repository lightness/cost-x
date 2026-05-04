import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { Permission } from '../../access/permission.enum';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { InviteByIdPipe } from '../../common/pipe/invite-by-id.pipe';
import { InviteeByInvitePipe } from '../../common/pipe/invitee-by-invite.pipe';
import { UserByIdPipe } from '../../common/pipe/user-by-id.pipe';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserRole } from '../../user/entity/user-role.enum';
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
  @Access.allow({
    or: [
      {
        and: [
          { self: 'inviterUser' },
          { permission: Permission.CREATE_CONTACT_INVITE, scope: AccessScope.USER },
        ],
      },
      { role: UserRole.ADMIN, scope: AccessScope.USER },
    ],
  })
  @Infer('inviterUser', { from: fromArg('dto.inviterUserId'), pipes: [UserByIdPipe] })
  async createInviteByEmail(
    @Args('dto') dto: CreateInviteByEmailInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.emailInviteService.createInviteByEmail(dto, tx);
  }

  @Mutation(() => Invite)
  @Access.allow({
    or: [
      {
        and: [
          { self: 'inviterUser' },
          { permission: Permission.CREATE_CONTACT_INVITE, scope: AccessScope.USER },
        ],
      },
      { role: UserRole.ADMIN, scope: AccessScope.USER },
    ],
  })
  @Infer('inviterUser', { from: fromArg('dto.inviterUserId'), pipes: [UserByIdPipe] })
  async createInvite(
    @Args('dto') dto: CreateInviteInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    const { inviteeUserId, inviterUserId } = dto;

    await this.inviteValidationService.validateCreateInvite(inviterUserId, inviteeUserId, tx);

    return this.inviteService.createInvite(inviterUserId, inviteeUserId, tx);
  }

  @Mutation(() => Invite)
  @Access.allow({
    or: [
      {
        and: [
          { self: 'inviteeUser' },
          { permission: Permission.ACCEPT_CONTACT_INVITE, scope: AccessScope.USER },
        ],
      },
      { role: UserRole.ADMIN, scope: AccessScope.USER },
    ],
  })
  @Infer('invite', { from: fromArg('inviteId'), pipes: [InviteByIdPipe] })
  @Infer('inviteeUser', { from: 'invite', pipes: [InviteeByInvitePipe] })
  async acceptInvite(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.inviteValidationService.validateAcceptInvite(inviteId, tx);

    return this.inviteService.acceptInvite(inviteId, tx);
  }

  @Mutation(() => Invite)
  @Access.allow({
    or: [
      {
        and: [
          { self: 'inviteeUser' },
          { permission: Permission.REJECT_CONTACT_INVITE, scope: AccessScope.USER },
        ],
      },
      { role: UserRole.ADMIN, scope: AccessScope.USER },
    ],
  })
  @Infer('invite', { from: fromArg('inviteId'), pipes: [InviteByIdPipe] })
  @Infer('inviteeUser', { from: 'invite', pipes: [InviteeByInvitePipe] })
  async rejectInvite(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.inviteValidationService.validateRejectInvite(inviteId, tx);

    return this.inviteService.rejectInvite(inviteId, tx);
  }

  @Mutation(() => Invite)
  @Access.allow({
    or: [
      {
        and: [
          { self: 'inviteeUser' },
          { permission: Permission.REJECT_CONTACT_INVITE, scope: AccessScope.USER },
        ],
      },
      { role: UserRole.ADMIN, scope: AccessScope.USER },
    ],
  })
  @Infer('invite', { from: fromArg('inviteId'), pipes: [InviteByIdPipe] })
  @Infer('inviteeUser', { from: 'invite', pipes: [InviteeByInvitePipe] })
  async rejectInviteAndBlockUser(
    @Args('inviteId', { type: () => Int }) inviteId: number,
    @Context('tx') tx: Prisma.TransactionClient,
    @CurrentUser() currentUser: User,
  ) {
    await this.inviteValidationService.validateRejectInviteAndBlockUser(inviteId, tx);

    return this.inviteService.rejectInviteAndBlockUser(inviteId, currentUser.id, tx);
  }
}
