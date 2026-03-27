import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactService } from './contact.service';
import { InvitesFilter } from './dto/invite-filter.type';
import { InviteStatus } from './entity/invite-status.enum';
import { Invite } from './entity/invite.entity';
import { UserBlockService } from './user-block.service';

@Injectable()
export class InviteService {
  constructor(
    private prisma: PrismaService,
    private contactService: ContactService,
    private userBlockService: UserBlockService,
  ) {}

  async createInvite(
    inviterUserId: number,
    inviteeUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite> {
    return tx.invite.create({
      data: {
        createdAt: new Date(),
        invitee: {
          connect: {
            id: inviteeUserId,
          },
        },
        inviter: {
          connect: {
            id: inviterUserId,
          },
        },
        status: InviteStatus.PENDING,
      },
    });
  }

  async acceptInvite(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite> {
    const invite = await tx.invite.update({
      data: {
        reactedAt: new Date(),
        status: InviteStatus.ACCEPTED,
      },
      where: {
        id: inviteId,
      },
    });

    await this.contactService.createContactPair(invite.inviterId, invite.inviteeId, invite.id, tx);

    return invite;
  }

  async rejectInvite(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite> {
    return tx.invite.update({
      data: {
        reactedAt: new Date(),
        status: InviteStatus.REJECTED,
      },
      where: {
        id: inviteId,
      },
    });
  }

  async rejectInviteAndBlockUser(
    inviteId: number,
    currentUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite> {
    const invite = await this.rejectInvite(inviteId, tx);
    await this.userBlockService.blockUser(invite.inviterId, invite.inviteeId, currentUserId, tx);

    return invite;
  }

  async isInviteExists(
    inviterId: number,
    inviteeId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const count = await tx.invite.count({
      where: {
        inviteeId,
        inviterId,
        reactedAt: null,
      },
    });

    return count > 0;
  }

  async listByInviteeUserId(
    inviteeUserId: number,
    filter: InvitesFilter,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite[]> {
    return this.listByInviteeUserIds([inviteeUserId], filter, tx);
  }

  async listByInviteeUserIds(
    inviteeUserIds: number[],
    filter: InvitesFilter,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite[]> {
    return tx.invite.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        inviteeId: { in: inviteeUserIds },
        ...filter,
      },
    });
  }

  async listByInviterUserId(
    inviterUserId: number,
    filter: InvitesFilter,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite[]> {
    return this.listByInviterUserIds([inviterUserId], filter, tx);
  }

  async listByInviterUserIds(
    inviterUserIds: number[],
    filter: InvitesFilter,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite[]> {
    return tx.invite.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        inviterId: { in: inviterUserIds },
        ...filter,
      },
    });
  }
}
