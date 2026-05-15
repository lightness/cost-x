import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { WorkspaceWhereInput } from '../../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { WorkspaceMemberService } from '../workspace-membership/workspace-member.service';
import { WorkspaceInDto, WorkspaceUpdateInDto, WorkspacesFilter } from './dto';
import { Workspace } from './entity/workspace.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private workspaceMemberService: WorkspaceMemberService,
  ) {}

  async listByOwnerIds(ownerIds: number[], filters: WorkspacesFilter): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: this.getWhereClause(ownerIds, filters),
    });
  }

  async create(
    dto: WorkspaceInDto,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Workspace> {
    const workspace = await tx.workspace.create({
      data: {
        defaultCurrency: dto.defaultCurrency,
        owner: {
          connect: {
            id: currentUser.id,
          },
        },
        title: dto.title,
      },
      include: {
        owner: true,
      },
    });

    await this.workspaceMemberService.create(
      workspace.id,
      currentUser.id,
      null,
      currentUser.id,
      tx,
    );

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_CREATED, {
      actorId: currentUser.id,
      tx,
      workspace,
    });

    return workspace;
  }

  async update(
    workspace: Workspace,
    dto: WorkspaceUpdateInDto,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Workspace> {
    const updatedWorkspace = await tx.workspace.update({
      data: { title: dto.title },
      where: { id: workspace.id },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_UPDATED, {
      actorId: currentUser.id,
      newWorkspace: updatedWorkspace,
      oldWorkspace: workspace,
      tx,
    });

    return updatedWorkspace;
  }

  async delete(
    workspace: Workspace,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Workspace> {
    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_DELETED, {
      actorId: currentUser.id,
      tx,
      workspace,
    });

    return tx.workspace.delete({ where: { id: workspace.id } });
  }

  // private

  private getWhereClause(ownerIds: number[], filters: WorkspacesFilter): WorkspaceWhereInput {
    return {
      defaultCurrency: filters.defaultCurrency ? { equals: filters.defaultCurrency } : undefined,
      id: filters.id ? { equals: filters.id } : undefined,
      ownerId: { in: ownerIds },
      title: filters.title ? { contains: filters.title, mode: 'insensitive' } : undefined,
    };
  }
}
