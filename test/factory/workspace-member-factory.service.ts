import { Injectable } from '@nestjs/common';
import {
  WorkspaceInviteStatus,
  WorkspaceMember,
  WorkspacePermission,
} from '../../generated/prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

@Injectable()
export class WorkspaceMemberFactoryService {
  constructor(private prisma: PrismaService) {}

  async create(
    workspaceId: number,
    userId: number,
    options: { permissions?: WorkspacePermission[] } = {},
  ): Promise<WorkspaceMember> {
    const permissions = options.permissions ?? Object.values(WorkspacePermission);
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });

    const invite = await this.prisma.workspaceInvite.create({
      data: {
        createdAt: new Date(),
        invitee: { connect: { id: userId } },
        inviter: { connect: { id: workspace.ownerId } },
        permissions: [],
        reactedAt: new Date(),
        status: WorkspaceInviteStatus.ACCEPTED,
        workspace: { connect: { id: workspaceId } },
      },
    });

    const member = await this.prisma.workspaceMember.create({
      data: {
        invite: { connect: { id: invite.id } },
        joinedAt: new Date(),
        user: { connect: { id: userId } },
        workspace: { connect: { id: workspaceId } },
      },
    });

    if (permissions.length > 0) {
      await this.prisma.userWorkspacePermission.createMany({
        data: permissions.map((permission) => ({ permission, userId, workspaceId })),
      });
    }

    return member;
  }
}
