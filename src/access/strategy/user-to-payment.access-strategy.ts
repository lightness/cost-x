import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, Rule, WorkspaceRole } from '../interfaces';
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

    if (rule.workspaceRole === WorkspaceRole.OWNER) {
      return payment.item.workspace?.ownerId === userId;
    }

    if (rule.workspaceRole === WorkspaceRole.MEMBER) {
      const permission = Array.isArray(rule.permission) ? rule.permission[0] : rule.permission;
      const member = await this.prisma.workspaceMember.findFirst({
        select: { permissions: true },
        where: { userId, workspaceId: payment.item.workspaceId, leftAt: null },
      });

      return member?.permissions.includes(permission) ?? false;
    }

    return false;
  }
}
