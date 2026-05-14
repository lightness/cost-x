import { BadRequestException, Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { BalanceCurrencyMode, Currency, Prisma, StakeRule } from '../../generated/prisma/client';
import { CurrencyRateService } from '../currency-rate/currency-rate.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentBalanceService {
  constructor(
    private prisma: PrismaService,
    private currencyRateService: CurrencyRateService,
  ) {}

  async syncPaymentBalance(
    paymentId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const payment = await tx.payment.findUniqueOrThrow({
      include: {
        item: {
          include: {
            workspace: true,
          },
        },
      },
      where: { id: paymentId },
    });

    const { item } = payment;
    const { workspace } = item;

    const activeMembers = await tx.workspaceMember.findMany({
      orderBy: { joinedAt: 'asc' },
      where: { removedAt: null, workspaceId: workspace.id },
    });

    let itemStakes: { workspaceMemberId: number; value: number }[] = [];

    if (item.stakeRule === null) {
      itemStakes = await tx.itemStake.findMany({
        where: { itemId: item.id },
      });
    }

    let cost = payment.cost;
    const currency =
      workspace.balanceCurrencyMode === BalanceCurrencyMode.DEFAULT_CURRENCY
        ? workspace.defaultCurrency
        : payment.currency;

    if (
      workspace.balanceCurrencyMode === BalanceCurrencyMode.DEFAULT_CURRENCY &&
      payment.currency !== workspace.defaultCurrency
    ) {
      const rate = await this.currencyRateService.get({
        date: payment.date,
        fromCurrency: payment.currency,
        toCurrency: workspace.defaultCurrency,
      });

      if (!rate) {
        throw new BadRequestException(
          `No currency rate available for ${payment.currency} → ${workspace.defaultCurrency} on ${payment.date.toISOString().slice(0, 10)}`,
        );
      }

      cost = Decimal.mul(cost, rate);
    }

    const effectiveStakes = this.resolveEffectiveStakes(
      item,
      activeMembers,
      payment.payerId,
      itemStakes,
      workspace,
    );

    const balanceChanges = this.computeBalanceChanges(
      payment.payerId,
      effectiveStakes,
      currency,
      cost,
    );

    await tx.paymentBalanceChange.deleteMany({ where: { paymentId } });

    if (balanceChanges.length > 0) {
      await tx.paymentBalanceChange.createMany({
        data: balanceChanges.map((bc) => ({ ...bc, paymentId })),
      });
    }
  }

  async syncItemBalance(itemId: number, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    const payments = await tx.payment.findMany({
      select: { id: true },
      where: { itemId },
    });

    for (const payment of payments) {
      await this.syncPaymentBalance(payment.id, tx);
    }
  }

  async syncWorkspaceBalance(
    workspaceId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const items = await tx.item.findMany({
      select: { id: true },
      where: { workspaceId },
    });

    for (const item of items) {
      await this.syncItemBalance(item.id, tx);
    }
  }

  private resolveEffectiveStakes(
    item: { stakeRule: StakeRule | null },
    activeMembers: { id: number; userId: number }[],
    payerId: number,
    itemStakes: { workspaceMemberId: number; value: number }[],
    workspace: { ownerId: number },
  ): Map<number, number> {
    const stakes = new Map<number, number>();

    if (item.stakeRule === StakeRule.EQUALLY) {
      for (const member of activeMembers) {
        stakes.set(member.id, 1);
      }
    } else if (item.stakeRule === StakeRule.ALL_WORKSPACE_OWNER) {
      for (const member of activeMembers) {
        stakes.set(member.id, member.userId === workspace.ownerId ? 1 : 0);
      }
    } else if (item.stakeRule === StakeRule.ALL_PAYER) {
      for (const member of activeMembers) {
        stakes.set(member.id, member.id === payerId ? 1 : 0);
      }
    } else {
      const stakeMap = new Map(itemStakes.map((s) => [s.workspaceMemberId, s.value]));

      for (const member of activeMembers) {
        stakes.set(member.id, stakeMap.get(member.id) ?? 0);
      }
    }

    return stakes;
  }

  private computeBalanceChanges(
    payerId: number,
    effectiveStakes: Map<number, number>,
    currency: Currency,
    cost: Decimal,
  ): { workspaceMemberId: number; value: Decimal; currency: Currency }[] {
    const totalStakes = Array.from(effectiveStakes.values()).reduce((sum, s) => sum + s, 0);

    return Array.from(effectiveStakes.entries()).map(([workspaceMemberId, stake]) => {
      let value: Decimal;

      if (totalStakes === 0) {
        value = new Decimal(0);
      } else {
        const ratio = new Decimal(stake).div(new Decimal(totalStakes));

        if (workspaceMemberId === payerId) {
          value = cost.mul(new Decimal(1).minus(ratio));
        } else {
          value = cost.mul(ratio).neg();
        }
      }

      return { currency, value, workspaceMemberId };
    });
  }
}
