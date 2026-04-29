import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { WorkspaceMember } from './entity/workspace-member.entity';

@Injectable()
export class WorkspaceMemberService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
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
