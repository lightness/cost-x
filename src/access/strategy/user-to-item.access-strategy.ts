import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule, WorkspaceRole } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserToItemAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {}

  isApplicable(rule: Rule): boolean {
    return rule.targetScope === AccessScope.ITEM && rule.sourceScope === AccessScope.USER;
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const userId = getSourceId(ctx);
    const itemId = getTargetId(ctx);

    const item = await this.prisma.item.findUnique({
      select: { workspace: { select: { ownerId: true } }, workspaceId: true },
      where: { id: itemId },
    });

    if (!item) {
      return false;
    }

    if (rule.workspaceRole === WorkspaceRole.OWNER) {
      return item.workspace?.ownerId === userId;
    }

    if (rule.workspaceRole === WorkspaceRole.MEMBER) {
      const permission = Array.isArray(rule.permission) ? rule.permission[0] : rule.permission;
      const member = await this.prisma.workspaceMember.findFirst({
        select: { permissions: true },
        where: { leftAt: null, userId, workspaceId: item.workspaceId },
      });

      return member?.permissions.includes(permission) ?? false;
    }

    return false;
  }
}
