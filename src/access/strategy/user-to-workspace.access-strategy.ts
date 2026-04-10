import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule, WorkspaceRole } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserToWorkspaceAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {}

  isApplicable(rule: Rule): boolean {
    return rule.targetScope === AccessScope.WORKSPACE && rule.sourceScope === AccessScope.USER;
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const userId = getSourceId(ctx);
    const workspaceId = getTargetId(ctx);

    if (rule.workspaceRole === WorkspaceRole.OWNER) {
      const workspace = await this.prisma.workspace.findUnique({
        select: { ownerId: true },
        where: { id: workspaceId },
      });

      return workspace?.ownerId === userId;
    }

    if (rule.workspaceRole === WorkspaceRole.MEMBER) {
      const permission = Array.isArray(rule.permission) ? rule.permission[0] : rule.permission;
      const member = await this.prisma.workspaceMember.findFirst({
        select: { permissions: true },
        where: { userId, workspaceId, leftAt: null },
      });

      return member?.permissions.includes(permission) ?? false;
    }

    return false;
  }
}
