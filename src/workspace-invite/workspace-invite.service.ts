import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Permission, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { WorkspaceInviteStatus } from './entity/workspace-invite-status.enum';
import { WorkspaceInvite } from './entity/workspace-invite.entity';
import { WorkspaceMember } from './entity/workspace-member.entity';

@Injectable()
export class WorkspaceInviteService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createInvite(
    inviterId: number,
    workspaceId: number,
    inviteeUserId: number,
    permissions: Permission[],
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    return tx.workspaceInvite.create({
      data: {
        inviter: { connect: { id: inviterId } },
        invitee: { connect: { id: inviteeUserId } },
        workspace: { connect: { id: workspaceId } },
        status: WorkspaceInviteStatus.PENDING,
        permissions,
      },
    });
  }

  async acceptInvite(
    inviteId: number,
    actorId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    const invite = await tx.workspaceInvite.update({
      data: { status: WorkspaceInviteStatus.ACCEPTED, reactedAt: new Date() },
      where: { id: inviteId },
    });

    await tx.workspaceMember.create({
      data: {
        workspace: { connect: { id: invite.workspaceId } },
        user: { connect: { id: invite.inviteeId } },
        permissions: invite.permissions,
      },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_MEMBER_JOINED, {
      actorId,
      inviteeId: invite.inviteeId,
      tx,
      workspaceId: invite.workspaceId,
    });

    return invite;
  }

  async rejectInvite(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    return tx.workspaceInvite.update({
      data: { status: WorkspaceInviteStatus.REJECTED, reactedAt: new Date() },
      where: { id: inviteId },
    });
  }

  async removeMember(
    workspaceId: number,
    userId: number,
    actorId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceMember> {
    await tx.workspaceMember.updateMany({
      data: { leftAt: new Date(), permissions: [] },
      where: { workspaceId, userId, leftAt: null },
    });

    const removedMember = await tx.workspaceMember.findFirstOrThrow({
      where: { workspaceId, userId },
      orderBy: { leftAt: 'desc' },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_MEMBER_REMOVED, {
      actorId,
      removedUserId: userId,
      tx,
      workspaceId,
    });

    return removedMember;
  }

  async isInviteExists(
    workspaceId: number,
    inviteeUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const count = await tx.workspaceInvite.count({
      where: { workspaceId, inviteeId: inviteeUserId, reactedAt: null },
    });

    return count > 0;
  }

  async isMemberExists(
    workspaceId: number,
    userId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const count = await tx.workspaceMember.count({
      where: { workspaceId, userId, leftAt: null },
    });

    return count > 0;
  }

  async listInvitesByInviteeUserIds(
    inviteeUserIds: number[],
    status: WorkspaceInviteStatus,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite[]> {
    return tx.workspaceInvite.findMany({
      orderBy: { createdAt: 'desc' },
      where: { inviteeId: { in: inviteeUserIds }, status },
    });
  }

  async listMembersByWorkspaceIds(
    workspaceIds: number[],
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceMember[]> {
    return tx.workspaceMember.findMany({
      where: { workspaceId: { in: workspaceIds }, leftAt: null },
    });
  }

  async listPendingInvitesByWorkspaceIds(
    workspaceIds: number[],
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite[]> {
    return tx.workspaceInvite.findMany({
      orderBy: { createdAt: 'desc' },
      where: { workspaceId: { in: workspaceIds }, status: WorkspaceInviteStatus.PENDING },
    });
  }

  async listWorkspaceIdsByMemberUserId(
    userId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<number[]> {
    const members = await tx.workspaceMember.findMany({
      select: { workspaceId: true },
      where: { userId, leftAt: null },
    });

    return members.map((m) => m.workspaceId);
  }
}
