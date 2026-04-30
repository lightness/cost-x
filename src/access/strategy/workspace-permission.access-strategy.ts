import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, ResolvedRule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class WorkspacePermissionAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {}

  isApplicable(rule: ResolvedRule): boolean {
    return rule.scope === AccessScope.WORKSPACE && (rule.workspacePermissions?.length ?? 0) > 0;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const currentUser = rule.sourceEntity as { id: number };
    const workspace = rule.targetEntity as { id: number };

    const activeMember = await this.prisma.workspaceMember.findFirst({
      select: { id: true },
      where: { removedAt: null, userId: currentUser.id, workspaceId: workspace.id },
    });

    if (!activeMember) {
      return false;
    }

    const granted = await this.prisma.userWorkspacePermission.findMany({
      select: { permission: true },
      where: {
        permission: { in: rule.workspacePermissions },
        userId: currentUser.id,
        workspaceId: workspace.id,
      },
    });

    return granted.length === rule.workspacePermissions.length;
  }
}
