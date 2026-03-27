import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule } from '../interfaces';
import { GlobalAccessStrategy } from './global.access-strategy';
import { AccessStrategy } from './interface';

@Injectable()
export class UserToContactAccessStrategy extends GlobalAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {
    super();
  }

  isApplicable(rule: Rule): boolean {
    return (
      rule.targetScope === AccessScope.CONTACT &&
      rule.sourceScope === AccessScope.USER &&
      ['source-user', 'target-user'].includes(rule.metadata?.as as string)
    );
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const userId = getSourceId(ctx);
    const contactId = getTargetId(ctx);

    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (rule.metadata?.as === 'source-user' && contact?.sourceUserId !== userId) {
      return false;
    }

    if (rule.metadata?.as === 'target-user' && contact?.targetUserId !== userId) {
      return false;
    }

    return super.executeRule(rule, ctx);
  }
}
