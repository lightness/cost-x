import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserToPaymentAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {}

  isApplicable(rule: Rule): boolean {
    return rule.targetScope === AccessScope.PAYMENT && rule.sourceScope === AccessScope.USER;
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const userId = getSourceId(ctx);
    const paymentId = getTargetId(ctx);

    const payment = await this.prisma.payment.findUnique({
      select: { item: { select: { workspace: { select: { ownerId: true } } } } },
      where: { id: paymentId },
    });

    return payment?.item?.workspace?.ownerId === userId;
  }
}
