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
      select: { item: { select: { workspaceId: true, workspace: { select: { ownerId: true } } } } },
      where: { id: paymentId },
    });

    if (!payment?.item) {
      return false;
    }

    if (payment.item.workspace?.ownerId === userId) {
      return true;
    }

    if (!rule.permission) {
      return false;
    }

    const permission = Array.isArray(rule.permission) ? rule.permission[0] : rule.permission;
    const member = await this.prisma.workspaceMember.findFirst({
      select: { permissions: true },
      where: { workspaceId: payment.item.workspaceId, userId, leftAt: null },
    });

    return member?.permissions.includes(permission) ?? false;
  }
}
