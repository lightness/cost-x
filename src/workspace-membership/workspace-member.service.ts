import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { WorkspaceMember } from './entity/workspace-member.entity';
import { CannotRemoveWorkspaceOwnerError, WorkspaceMemberAlreadyRemovedError } from './error';
import { WorkspaceMemberPermissionService } from './workspace-member-permission.service';

@Injectable()
export class WorkspaceMemberService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private memberPermissionService: WorkspaceMemberPermissionService,
  ) {}

  async create(
    workspaceId: number,
    userId: number,
    inviteId: number,
    actorId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceMember> {
    const member = await tx.workspaceMember.create({
      data: {
        invite: { connect: { id: inviteId } },
        joinedAt: new Date(),
        user: { connect: { id: userId } },
        workspace: { connect: { id: workspaceId } },
      },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_MEMBER_CREATED, {
      actorId,
      member,
      tx,
      workspaceId,
    });

    return member;
  }

  async remove(
    member: WorkspaceMember,
    actorId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceMember> {
    if (member.removedAt !== null) {
      throw new WorkspaceMemberAlreadyRemovedError();
    }

    const workspace = await tx.workspace.findUnique({ where: { id: member.workspaceId } });

    if (workspace?.ownerId === member.userId) {
      throw new CannotRemoveWorkspaceOwnerError();
    }

    const removedMember = await tx.workspaceMember.update({
      data: { removedAt: new Date(), removedByUserId: actorId },
      where: { id: member.id },
    });

    await this.memberPermissionService.revokeAllPermissions(removedMember, tx);

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_MEMBER_REMOVED, {
      actorId,
      member: removedMember,
      tx,
      workspaceId: member.workspaceId,
    });

    return removedMember;
  }

  async listByWorkspaceId(
    workspaceId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceMember[]> {
    return tx.workspaceMember.findMany({
      orderBy: { joinedAt: 'asc' },
      where: { removedAt: null, workspaceId },
    });
  }
}
