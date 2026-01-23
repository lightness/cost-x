import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule } from '../interfaces';
import { AccessStrategy } from './interface';
import { GlobalAccessStrategy } from './global.access-strategy';

@Injectable()
export class UserToTagAccessStrategy
  extends GlobalAccessStrategy
  implements AccessStrategy
{
  constructor(private prisma: PrismaService) {
    super();
  }

  isApplicable(rule: Rule): boolean {
    return (
      rule.targetScope === AccessScope.TAG &&
      rule.sourceScope === AccessScope.USER
    );
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const userId = getSourceId(ctx);
    const tagId = getTargetId(ctx);

    const tag = await this.prisma.tag.findUnique({
      select: {
        workspace: {
          select: {
            ownerId: true,
          },
        },
      },
      where: { id: tagId },
    });

    if (tag?.workspace?.ownerId !== userId) {
      return false;
    }

    return super.executeRule(rule, ctx);
  }
}
