import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserToInviteAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {}

  isApplicable(rule: Rule): boolean {
    return (
      rule.targetScope === AccessScope.INVITE &&
      rule.sourceScope === AccessScope.USER &&
      ['invitee', 'inviter'].includes(rule.metadata?.as as string)
    );
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const userId = getSourceId(ctx);
    const inviteId = getTargetId(ctx);

    const invite = await this.prisma.invite.findUnique({
      where: { id: inviteId },
    });

    if (rule.metadata?.as === 'invitee' && invite?.inviteeId !== userId) {
      return false;
    }

    if (rule.metadata?.as === 'inviter' && invite?.inviterId !== userId) {
      return false;
    }

    return true;
  }
}
