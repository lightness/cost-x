import { Injectable } from '@nestjs/common';
import { WorkspaceInvite, WorkspaceInviteStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserFactoryService } from './user-factory.service';
import { WorkspaceFactoryService } from './workspace-factory.service';

export type WorkspaceInviteKind = 'pending' | 'accepted' | 'rejected' | 'cancelled';

@Injectable()
export class WorkspaceInviteFactoryService {
  constructor(
    private prisma: PrismaService,
    private userFactory: UserFactoryService,
    private workspaceFactory: WorkspaceFactoryService,
  ) {}

  async create(
    kind: WorkspaceInviteKind = 'pending',
    overrides: Partial<{ workspaceId: number; inviterId: number; inviteeId: number }> = {},
  ): Promise<WorkspaceInvite> {
    const inviterId = overrides.inviterId ?? (await this.userFactory.create('active')).id;
    const workspaceId =
      overrides.workspaceId ?? (await this.workspaceFactory.create({ ownerId: inviterId })).id;
    const inviteeId = overrides.inviteeId ?? (await this.userFactory.create('active')).id;

    return this.prisma.workspaceInvite.create({
      data: {
        createdAt: new Date(),
        invitee: { connect: { id: inviteeId } },
        inviter: { connect: { id: inviterId } },
        permissions: [],
        reactedAt: kind === 'pending' ? null : new Date(),
        status: this.generateStatus(kind),
        workspace: { connect: { id: workspaceId } },
      },
    });
  }

  private generateStatus(kind: WorkspaceInviteKind): WorkspaceInviteStatus {
    switch (kind) {
      case 'pending':
        return WorkspaceInviteStatus.PENDING;
      case 'accepted':
        return WorkspaceInviteStatus.ACCEPTED;
      case 'rejected':
        return WorkspaceInviteStatus.REJECTED;
      case 'cancelled':
        return WorkspaceInviteStatus.CANCELLED;
    }
  }
}
