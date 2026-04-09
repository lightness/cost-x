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
      select: { workspace: { select: { ownerId: true } } },
      where: { id: tagId },
    });

    return tag?.workspace?.ownerId === userId;
  }
}
