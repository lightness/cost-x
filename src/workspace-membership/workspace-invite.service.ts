import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, WorkspaceInviteStatus, WorkspacePermission } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { Workspace } from '../workspace/entity/workspace.entity';
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
    workspace: Workspace,
    inviter: User,
    invitee: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    await this.validationService.validateCreateInvite(workspace.id, invitee.id, tx);

    return tx.workspaceInvite.create({
      data: {
        createdAt: new Date(),
        invitee: { connect: { id: invitee.id } },
        inviter: { connect: { id: inviter.id } },
        status: WorkspaceInviteStatus.PENDING,
        workspace: { connect: { id: workspace.id } },
      },
    });
  }

  async acceptInvite(
    invite: WorkspaceInvite,
    actor: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    await this.validationService.validateAcceptInvite(invite, tx);

    const updatedInvite = await tx.workspaceInvite.update({
      data: { reactedAt: new Date(), status: WorkspaceInviteStatus.ACCEPTED },
      where: { id: invite.id },
    });

    const member = await this.createMember(invite.workspaceId, invite.inviteeId, invite.id, tx);

    await this.seedWorkspacePermissions(invite.workspaceId, invite.inviteeId, tx);

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.MEMBER_JOINED, {
      actorId: actor.id,
      member,
      tx,
      workspaceId: invite.workspaceId,
    });

    return updatedInvite;
  }

  async rejectInvite(
    invite: WorkspaceInvite,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    this.validationService.validateRejectInvite(invite);

    return tx.workspaceInvite.update({
      data: { reactedAt: new Date(), status: WorkspaceInviteStatus.REJECTED },
      where: { id: invite.id },
    });
  }

  async cancelInvite(
    invite: WorkspaceInvite,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    this.validationService.validateCancelInvite(invite);

    return tx.workspaceInvite.update({
      data: { reactedAt: new Date(), status: WorkspaceInviteStatus.CANCELLED },
      where: { id: invite.id },
    });
  }

  async listPendingByWorkspaceId(
    workspaceId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite[]> {
    return tx.workspaceInvite.findMany({
      orderBy: { createdAt: 'desc' },
      where: { status: WorkspaceInviteStatus.PENDING, workspaceId },
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

  private async seedWorkspacePermissions(
    workspaceId: number,
    userId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.userWorkspacePermission.createMany({
      data: Object.values(WorkspacePermission).map((permission) => ({
        userId,
        workspaceId,
        permission,
      })),
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
