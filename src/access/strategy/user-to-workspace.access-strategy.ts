import { Injectable } from '@nestjs/common';
import type { GqlExecutionContext } from '@nestjs/graphql';
import type { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, type Rule } from '../interfaces';
import type { AccessStrategy } from './interface';
import { GlobalAccessStrategy } from './global.access-strategy';

@Injectable()
export class UserToWorkspaceAccessStrategy
  extends GlobalAccessStrategy
  implements AccessStrategy
{
  constructor(private prisma: PrismaService) {
    super();
  }

  isApplicable(rule: Rule): boolean {
    return (
      rule.targetScope === AccessScope.WORKSPACE &&
      rule.sourceScope === AccessScope.USER
    );
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const userId = getSourceId(ctx);
    const workspaceId = getTargetId(ctx);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (workspace.ownerId !== userId) {
      return false;
    }

    return super.executeRule(rule, ctx);
  }
}
