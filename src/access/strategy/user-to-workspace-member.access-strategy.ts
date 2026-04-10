import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserToWorkspaceMemberAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {}

  isApplicable(rule: Rule): boolean {
    return (
      rule.targetScope === AccessScope.WORKSPACE_MEMBER &&
      rule.sourceScope === AccessScope.USER &&
      ['invitee', 'inviter'].includes(rule.metadata?.as as string)
    );
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const userId = getSourceId(ctx);
    const inviteId = getTargetId(ctx);

    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
    });

    if (rule.metadata?.as === 'invitee') {
      return invite?.inviteeId === userId;
    }

    if (rule.metadata?.as === 'inviter') {
      return invite?.inviterId === userId;
    }

    return false;
  }
}
