import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule } from '../interfaces';
import { GlobalAccessStrategy } from './global.access-strategy';

@Injectable()
export class UserToWorkspaceAccessStrategy extends GlobalAccessStrategy {
  constructor(private prisma: PrismaService) {
    super()
  }

  isApplicable(rule: Rule): boolean {
    return rule.targetScope === AccessScope.WORKSPACE
      && rule.sourceScope === AccessScope.USER;
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