import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule } from '../interfaces';
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
      select: { workspace: { select: { ownerId: true } } },
      where: { id: itemId },
    });

    return item?.workspace?.ownerId === userId;
  }
}
