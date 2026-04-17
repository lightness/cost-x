import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, ResolvedRule, WorkspaceRole } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserToWorkspaceAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {}

  isApplicable(rule: ResolvedRule): boolean {
    return rule.scope === AccessScope.WORKSPACE;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const currentUser = rule.sourceEntity as { id: number };
    const workspace = rule.targetEntity as { id: number; ownerId: number };

    let userWorkspaceRole: WorkspaceRole;

    if (workspace.ownerId === currentUser.id) {
      userWorkspaceRole = WorkspaceRole.OWNER;
    } else {
      const member = await this.prisma.workspaceMember.findFirst({
        where: { removedAt: null, userId: currentUser.id, workspaceId: workspace.id },
      });

      if (!member) {
        return false;
      }

      userWorkspaceRole = WorkspaceRole.MEMBER;
    }

    return rule.workspaceRole.includes(userWorkspaceRole);
  }
}
