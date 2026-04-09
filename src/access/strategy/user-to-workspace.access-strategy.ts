import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule } from '../interfaces';
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

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    return workspace?.ownerId === userId;
  }
}
