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
    permissions: WorkspacePermission[],
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    await this.validationService.validateCreateInvite(
      workspace.id,
      inviter.id,
      invitee.id,
      permissions,
      tx,
    );

    const invite = await tx.workspaceInvite.create({
      data: {
        createdAt: new Date(),
        invitee: { connect: { id: invitee.id } },
        inviter: { connect: { id: inviter.id } },
        permissions,
        status: WorkspaceInviteStatus.PENDING,
        workspace: { connect: { id: workspace.id } },
      },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_INVITE_CREATED, {
      actorId: inviter.id,
      invite,
      tx,
      workspaceId: workspace.id,
    });

    return invite;
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

    await this.createMember(invite.workspaceId, invite.inviteeId, invite.id, tx);

    await this.seedWorkspacePermissions(invite.workspaceId, invite.inviteeId, invite.permissions, tx);

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_INVITE_ACCEPTED, {
      actorId: actor.id,
      invite: updatedInvite,
      tx,
      workspaceId: invite.workspaceId,
    });

    return updatedInvite;
  }

  async rejectInvite(
    invite: WorkspaceInvite,
    actor: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    this.validationService.validateRejectInvite(invite);

    const updatedInvite = await tx.workspaceInvite.update({
      data: { reactedAt: new Date(), status: WorkspaceInviteStatus.REJECTED },
      where: { id: invite.id },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_INVITE_REJECTED, {
      actorId: actor.id,
      invite: updatedInvite,
      tx,
      workspaceId: invite.workspaceId,
    });

    return updatedInvite;
  }

  async cancelInvite(
    invite: WorkspaceInvite,
    actor: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    this.validationService.validateCancelInvite(invite);

    const updatedInvite = await tx.workspaceInvite.update({
      data: { reactedAt: new Date(), status: WorkspaceInviteStatus.CANCELLED },
      where: { id: invite.id },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_INVITE_CANCELLED, {
      actorId: actor.id,
      invite: updatedInvite,
      tx,
      workspaceId: invite.workspaceId,
    });

    return updatedInvite;
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
    permissions: WorkspacePermission[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (permissions.length === 0) {
      return;
    }

    await tx.userWorkspacePermission.createMany({
      data: permissions.map((permission) => ({
        permission,
        userId,
        workspaceId,
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
