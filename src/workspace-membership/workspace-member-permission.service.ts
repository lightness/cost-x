import { Injectable } from '@nestjs/common';
import { Prisma, WorkspacePermission } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../user/entity/user-role.enum';
import User from '../user/entity/user.entity';
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
    actor: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await this.validateActorCanModify(member.workspaceId, actor, permissions, tx);

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
    actor: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await this.validateActorCanModify(member.workspaceId, actor, permissions, tx);

    await tx.userWorkspacePermission.deleteMany({
      where: {
        permission: { in: permissions },
        userId: member.userId,
        workspaceId: member.workspaceId,
      },
    });
  }

  /**
   * Validates that the actor holds every permission they are trying to grant or revoke.
   *
   * This is intentionally separate from the `@Access` decorator: `@Access` is coarse-grained
   * entry control — it answers "can this actor call the mutation at all?" based on static role
   * or ownership rules. This method answers a finer-grained, input-dependent question: "can the
   * actor grant/revoke *these specific permissions*?" — something that cannot be expressed in
   * decorator metadata because the answer depends on the runtime `permissions[]` argument.
   */
  private async validateActorCanModify(
    workspaceId: number,
    actor: User,
    permissions: WorkspacePermission[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (permissions.length === 0) {
      return;
    }

    if (actor.role === UserRole.ADMIN) {
      return;
    }

    const workspace = await tx.workspace.findUnique({ where: { id: workspaceId } });

    if (workspace.ownerId === actor.id) {
      return;
    }

    const granted = await tx.userWorkspacePermission.findMany({
      select: { permission: true },
      where: { permission: { in: permissions }, userId: actor.id, workspaceId },
    });

    if (granted.length !== permissions.length) {
      throw new InsufficientActorPermissionsError();
    }
  }
}
