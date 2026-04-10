import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserToTagAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {}

  isApplicable(rule: Rule): boolean {
    return rule.targetScope === AccessScope.TAG && rule.sourceScope === AccessScope.USER;
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const userId = getSourceId(ctx);
    const tagId = getTargetId(ctx);

    const tag = await this.prisma.tag.findUnique({
      select: { workspace: { select: { ownerId: true } }, workspaceId: true },
      where: { id: tagId },
    });

    if (!tag) {
      return false;
    }

    if (tag.workspace?.ownerId === userId) {
      return true;
    }

    if (!rule.permission) {
      return false;
    }

    const permission = Array.isArray(rule.permission) ? rule.permission[0] : rule.permission;
    const member = await this.prisma.workspaceMember.findFirst({
      select: { permissions: true },
      where: { leftAt: null, userId, workspaceId: tag.workspaceId },
    });

    return member?.permissions.includes(permission) ?? false;
  }
}
