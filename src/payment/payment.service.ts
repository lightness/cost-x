import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { cmp } from 'type-comparator';
import { Prisma } from '../../generated/prisma/client';
import { ConsistencyService } from '../consistency/consistency.service';
import { PaymentLike } from '../item-cost/interfaces';
import Item from '../item/entity/item.entity';
import { PaymentBalanceService } from '../payment-balance/payment-balance.service';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { WorkspaceMember } from '../workspace-membership/entity/workspace-member.entity';
import { WorkspaceMemberNotBelongingToWorkspaceError } from '../workspace-membership/error';
import { PaymentInDto, PaymentsFilter } from './dto';
import Payment from './entity/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private consistencyService: ConsistencyService,
    private eventEmitter: EventEmitter2,
    private paymentBalanceService: PaymentBalanceService,
  ) {}

  async getPaymentsByItemIds(
    itemIds: number[],
    filter: PaymentsFilter,
  ): Promise<Map<number, Payment[]>> {
    const { dateFrom, dateTo, ids } = filter || {};

    const payments = await this.prisma.payment.findMany({
      where: {
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
        id: ids ? { in: ids } : undefined,
        itemId: { in: itemIds },
      },
    });

    return payments.reduce((map: Map<number, Payment[]>, payment: Payment) => {
      const { itemId } = payment;

      if (map.has(itemId)) {
        map.set(itemId, [...map.get(itemId), payment]);
      } else {
        map.set(itemId, [payment]);
      }

      return map;
    }, new Map());
  }

  async getPayment(item: Item, payment: Payment): Promise<Payment> {
    this.consistencyService.paymentToItem.ensureIsBelonging(payment, item);

    if (payment.itemId !== item.id) {
      throw new BadRequestException(`Payment #${payment.id} does not belong to item #${item.id}`);
    }

    return payment;
  }

  async createPayment(
    item: Item,
    payer: WorkspaceMember,
    dto: Omit<PaymentInDto, 'payerId'>,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Payment> {
    if (payer.workspaceId !== item.workspaceId) {
      throw new WorkspaceMemberNotBelongingToWorkspaceError(payer.id);
    }

    const payment = await tx.payment.create({
      data: {
        ...dto,
        item: {
          connect: {
            id: item.id,
          },
        },
        payer: {
          connect: {
            id: payer.id,
          },
        },
      },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.PAYMENT_CREATED, {
      actorId: currentUser.id,
      payment,
      tx,
      workspaceId: item.workspaceId,
    });

    await this.paymentBalanceService.syncPaymentBalance(payment.id, tx);

    return payment;
  }

  async updatePayment(
    payment: Payment,
    payer: WorkspaceMember,
    dto: Omit<PaymentInDto, 'payerId'>,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Payment> {
    const item = await tx.item.findUniqueOrThrow({ where: { id: payment.itemId } });

    if (payer.workspaceId !== item.workspaceId) {
      throw new WorkspaceMemberNotBelongingToWorkspaceError(payer.id);
    }

    const updatedPayment = await tx.payment.update({
      data: {
        cost: dto.cost,
        currency: dto.currency,
        date: dto.date,
        payerId: payer.id,
        title: dto.title,
      },
      where: { id: payment.id },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.PAYMENT_UPDATED, {
      actorId: currentUser.id,
      newPayment: updatedPayment,
      oldPayment: payment,
      tx,
      workspaceId: item.workspaceId,
    });

    await this.paymentBalanceService.syncPaymentBalance(updatedPayment.id, tx);

    return updatedPayment;
  }

  async deletePayment(
    payment: Payment,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const item = await tx.item.findUniqueOrThrow({ where: { id: payment.itemId } });

    await tx.payment.delete({ where: { id: payment.id } });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.PAYMENT_DELETED, {
      actorId: currentUser.id,
      payment,
      tx,
      workspaceId: item.workspaceId,
    });
  }

  async getItemPayments(itemId: number, filter: PaymentsFilter): Promise<Payment[]> {
    const { dateFrom, dateTo, ids } = filter || {};

    return this.prisma.payment.findMany({
      where: {
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
        id: ids ? { in: ids } : undefined,
        itemId,
      },
    });
  }

  filterPayments<T extends PaymentLike>(payments: T[], filters: PaymentsFilter): T[] {
    const { dateFrom, dateTo, ids } = filters || {};

    return payments.filter(({ id, date }) => {
      return (
        (dateFrom ? dateFrom <= date : true) &&
        (dateTo ? dateTo > date : true) &&
        (ids ? ids.includes(id) : true)
      );
    });
  }

  getFirstPaymentDate<T extends PaymentLike>(payments: T[]): Date {
    return payments
      .map((payment) => payment.date)
      .sort(cmp().asc())
      .at(0);
  }

  getLastPaymentDate<T extends PaymentLike>(payments: T[]): Date {
    return payments
      .map((payment) => payment.date)
      .sort(cmp().desc())
      .at(0);
  }
}
