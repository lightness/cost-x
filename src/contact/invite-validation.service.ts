import { Injectable } from '@nestjs/common';
import { InviteStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactService } from './contact.service';
import { Invite } from './entity/invite.entity';
import {
  ContactAlreadyExistsError,
  ImproperInviteStatusError,
  InviteeAlreadySendInviteError,
  InviteeBlockedInviterError,
  InviteNotFoundError,
  InviterAlreadySendInviteError,
  InviterBlockedInviteeError,
} from './error';
import { InviteService } from './invite.service';
import { UserBlockService } from './user-block.service';

@Injectable()
export class InviteValidationService {
  constructor(
    private prisma: PrismaService,
    private contactService: ContactService,
    private inviteService: InviteService,
    private userBlockService: UserBlockService,
  ) {}

  async validateCreateInvite(
    inviterUserId: number,
    inviteeUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    await this.validateInviteNotExists(inviterUserId, inviteeUserId, tx);
    await this.validateReverseInviteNotExists(inviterUserId, inviteeUserId, tx);
    await this.validateContactNotExists(inviterUserId, inviteeUserId, tx);
    await this.validateInviterIsNotBlocked(inviterUserId, inviteeUserId, tx);
    await this.validateInviteeIsNotBlocked(inviterUserId, inviteeUserId, tx);
  }

  async validateAcceptInvite(inviteId: number, tx: Prisma.TransactionClient = this.prisma) {
    const invite = await this.validateInviteExists(inviteId, tx);
    await this.validateInviteIsInStatus(invite, InviteStatus.PENDING);

    const { inviterId: inviterUserId, inviteeId: inviteeUserId } = invite;
    await this.validateContactNotExists(inviterUserId, inviteeUserId, tx);
    await this.validateInviterIsNotBlocked(inviterUserId, inviteeUserId, tx);
    await this.validateInviteeIsNotBlocked(inviterUserId, inviteeUserId, tx);
  }

  async validateRejectInvite(inviteId: number, tx: Prisma.TransactionClient = this.prisma) {
    const invite = await this.validateInviteExists(inviteId, tx);
    await this.validateInviteIsInStatus(invite, InviteStatus.PENDING);

    const { inviterId: inviterUserId, inviteeId: inviteeUserId } = invite;
    await this.validateContactNotExists(inviterUserId, inviteeUserId, tx);
    await this.validateInviterIsNotBlocked(inviterUserId, inviteeUserId, tx);
    await this.validateInviteeIsNotBlocked(inviterUserId, inviteeUserId, tx);
  }

  async validateRejectInviteAndBlockUser(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const invite = await this.validateInviteExists(inviteId, tx);
    await this.validateInviteIsInStatus(invite, InviteStatus.PENDING);

    const { inviterId: inviterUserId, inviteeId: inviteeUserId } = invite;
    await this.validateContactNotExists(inviterUserId, inviteeUserId, tx);
    await this.validateInviterIsNotBlocked(inviterUserId, inviteeUserId, tx);
    await this.validateInviteeIsNotBlocked(inviterUserId, inviteeUserId, tx);
  }

  private async validateInviteNotExists(
    inviterUserId: number,
    inviteeUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const isInviteAlreadyExists = await this.inviteService.isInviteExists(
      inviterUserId,
      inviteeUserId,
      tx,
    );

    if (isInviteAlreadyExists) {
      throw new InviterAlreadySendInviteError();
    }
  }

  private async validateInviteExists(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite> {
    const invite = await tx.invite.findUnique({ where: { id: inviteId } });

    if (!invite) {
      throw new InviteNotFoundError();
    }

    return invite;
  }

  private async validateInviteIsInStatus(invite: Invite, ...statuses: InviteStatus[]) {
    if (!statuses.includes(invite.status)) {
      throw new ImproperInviteStatusError(`Improper invite status: ${invite.status}`);
    }
  }

  private async validateReverseInviteNotExists(
    inviterUserId: number,
    inviteeUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const isReverseInviteAlreadyExists = await this.inviteService.isInviteExists(
      inviteeUserId,
      inviterUserId,
      tx,
    );

    if (isReverseInviteAlreadyExists) {
      throw new InviteeAlreadySendInviteError();
    }
  }

  private async validateContactNotExists(
    inviterUserId: number,
    inviteeUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const isContactAlreadyExists = await this.contactService.isContactExists(
      inviterUserId,
      inviteeUserId,
      tx,
    );

    if (isContactAlreadyExists) {
      throw new ContactAlreadyExistsError();
    }
  }

  private async validateInviterIsNotBlocked(
    inviterUserId: number,
    inviteeUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const isInviterBlocked = await this.userBlockService.isUserBlockExists(
      inviterUserId,
      inviteeUserId,
      tx,
    );

    if (isInviterBlocked) {
      throw new InviteeBlockedInviterError();
    }
  }

  private async validateInviteeIsNotBlocked(
    inviterUserId: number,
    inviteeUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const isInviteeBlocked = await this.userBlockService.isUserBlockExists(
      inviteeUserId,
      inviterUserId,
      tx,
    );

    if (isInviteeBlocked) {
      throw new InviterBlockedInviteeError();
    }
  }
}
