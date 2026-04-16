import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, ResolvedRule } from '../interfaces';
import { GlobalAccessStrategy } from './global.access-strategy';
import { AccessStrategy } from './interface';

@Injectable()
export class UserToWorkspaceAccessStrategy extends GlobalAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {
    super();
  }

  isApplicable(rule: ResolvedRule): boolean {
    return rule.targetScope === AccessScope.WORKSPACE;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const currentUser = rule.sourceEntity as { id: number };
    const workspace = rule.targetEntity as { id: number; ownerId: number };

    if (workspace.ownerId === currentUser.id) {
      return super.executeRule(rule);
    }

    const member = await this.prisma.workspaceMember.findFirst({
      where: { removedAt: null, userId: currentUser.id, workspaceId: workspace.id },
    });

    if (!member) {
      return false;
    }

    return super.executeRule(rule);
  }
}
