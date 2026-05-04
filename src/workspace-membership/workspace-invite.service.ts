import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, WorkspaceInviteStatus, WorkspacePermission } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { Workspace } from '../workspace/entity/workspace.entity';
import { WorkspaceInvite } from './entity/workspace-invite.entity';
import { WorkspaceInviteValidationService } from './workspace-invite-validation.service';
import { WorkspaceMemberPermissionService } from './workspace-member-permission.service';
import { WorkspaceMemberService } from './workspace-member.service';

@Injectable()
export class WorkspaceInviteService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private validationService: WorkspaceInviteValidationService,
    private memberService: WorkspaceMemberService,
    private memberPermissionService: WorkspaceMemberPermissionService,
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

    await this.memberService.create(invite.workspaceId, invite.inviteeId, invite.id, actor.id, tx);
    await this.memberPermissionService.seedPermissions(
      invite.workspaceId,
      invite.inviteeId,
      invite.permissions,
      tx,
    );

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
}
