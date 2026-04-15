import { Injectable } from '@nestjs/common';
import { WorkspaceInvite, WorkspaceInviteStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserFactoryService } from './user-factory.service';
import { WorkspaceFactoryService } from './workspace-factory.service';

export type WorkspaceInviteKind = 'pending' | 'accepted' | 'rejected';

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
    const workspaceId = overrides.workspaceId ?? (await this.workspaceFactory.create(inviterId)).id;
    const inviteeId = overrides.inviteeId ?? (await this.userFactory.create('active')).id;

    return this.prisma.workspaceInvite.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        inviter: { connect: { id: inviterId } },
        invitee: { connect: { id: inviteeId } },
        status: this.generateStatus(kind),
        createdAt: new Date(),
        reactedAt: kind === 'pending' ? null : new Date(),
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
    }
  }
}
