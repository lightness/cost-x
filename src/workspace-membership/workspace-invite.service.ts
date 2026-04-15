import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, WorkspaceInviteStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { WorkspaceInvite } from './entity/workspace-invite.entity';
import { WorkspaceMember } from './entity/workspace-member.entity';
import { WorkspaceInviteValidationService } from './workspace-invite-validation.service';

@Injectable()
export class WorkspaceInviteService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private validationService: WorkspaceInviteValidationService,
  ) {}

  async createInvite(
    workspaceId: number,
    inviterId: number,
    inviteeId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    await this.validationService.validateCreateInvite(workspaceId, inviteeId, tx);

    return tx.workspaceInvite.create({
      data: {
        createdAt: new Date(),
        invitee: { connect: { id: inviteeId } },
        inviter: { connect: { id: inviterId } },
        status: WorkspaceInviteStatus.PENDING,
        workspace: { connect: { id: workspaceId } },
      },
    });
  }

  async acceptInvite(
    inviteId: number,
    actorId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    const invite = await this.validationService.findInviteOrThrow(inviteId, tx);
    await this.validationService.validateAcceptInvite(invite, tx);

    const updatedInvite = await tx.workspaceInvite.update({
      data: { reactedAt: new Date(), status: WorkspaceInviteStatus.ACCEPTED },
      where: { id: inviteId },
    });

    const member = await this.createMember(invite.workspaceId, invite.inviteeId, invite.id, tx);

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.MEMBER_JOINED, {
      actorId,
      member,
      tx,
      workspaceId: invite.workspaceId,
    });

    return updatedInvite;
  }

  async rejectInvite(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    const invite = await this.validationService.findInviteOrThrow(inviteId, tx);
    this.validationService.validateRejectInvite(invite);

    return tx.workspaceInvite.update({
      data: { reactedAt: new Date(), status: WorkspaceInviteStatus.REJECTED },
      where: { id: inviteId },
    });
  }

  async cancelInvite(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    const invite = await this.validationService.findInviteOrThrow(inviteId, tx);
    this.validationService.validateCancelInvite(invite);

    return tx.workspaceInvite.update({
      data: { reactedAt: new Date(), status: WorkspaceInviteStatus.CANCELLED },
      where: { id: inviteId },
    });
  }

  async listByWorkspaceId(
    workspaceId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite[]> {
    return tx.workspaceInvite.findMany({
      orderBy: { createdAt: 'desc' },
      where: { workspaceId },
    });
  }

  async listByInviteeId(
    inviteeId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite[]> {
    return tx.workspaceInvite.findMany({
      orderBy: { createdAt: 'desc' },
      where: { inviteeId },
    });
  }

  async listMembersByWorkspaceId(
    workspaceId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceMember[]> {
    return tx.workspaceMember.findMany({
      orderBy: { joinedAt: 'asc' },
      where: { removedAt: null, workspaceId },
    });
  }

  private async createMember(
    workspaceId: number,
    userId: number,
    inviteId: number,
    tx: Prisma.TransactionClient,
  ): Promise<WorkspaceMember> {
    return tx.workspaceMember.create({
      data: {
        invite: { connect: { id: inviteId } },
        joinedAt: new Date(),
        user: { connect: { id: userId } },
        workspace: { connect: { id: workspaceId } },
      },
    });
  }
}
