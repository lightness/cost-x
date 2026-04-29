import { Injectable } from '@nestjs/common';
import { Prisma, WorkspacePermission } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceMember } from './entity/workspace-member.entity';
import { InsufficientActorPermissionsError } from './error';

@Injectable()
export class WorkspaceMemberPermissionService {
  constructor(private prisma: PrismaService) {}

  async seedPermissions(
    workspaceId: number,
    userId: number,
    permissions: WorkspacePermission[],
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    if (permissions.length === 0) {
      return;
    }

    await tx.userWorkspacePermission.createMany({
      data: permissions.map((permission) => ({ permission, userId, workspaceId })),
    });
  }

  async grantPermissions(
    member: WorkspaceMember,
    permissions: WorkspacePermission[],
    actorId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await this.validateActorCanModify(member.workspaceId, actorId, permissions, tx);

    await tx.userWorkspacePermission.createMany({
      data: permissions.map((permission) => ({
        permission,
        userId: member.userId,
        workspaceId: member.workspaceId,
      })),
      skipDuplicates: true,
    });
  }

  async revokePermissions(
    member: WorkspaceMember,
    permissions: WorkspacePermission[],
    actorId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await this.validateActorCanModify(member.workspaceId, actorId, permissions, tx);

    await tx.userWorkspacePermission.deleteMany({
      where: {
        permission: { in: permissions },
        userId: member.userId,
        workspaceId: member.workspaceId,
      },
    });
  }

  private async validateActorCanModify(
    workspaceId: number,
    actorId: number,
    permissions: WorkspacePermission[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (permissions.length === 0) {
      return;
    }

    const workspace = await tx.workspace.findUnique({ where: { id: workspaceId } });

    if (workspace.ownerId === actorId) {
      return;
    }

    const granted = await tx.userWorkspacePermission.findMany({
      select: { permission: true },
      where: { permission: { in: permissions }, userId: actorId, workspaceId },
    });

    if (granted.length !== permissions.length) {
      throw new InsufficientActorPermissionsError();
    }
  }
}
