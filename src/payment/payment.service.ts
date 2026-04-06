import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { cmp } from 'type-comparator';
import { Prisma } from '../../generated/prisma/client';
import { ConsistencyService } from '../consistency/consistency.service';
import { PaymentLike } from '../item-cost/interfaces';
import Item from '../item/entity/item.entity';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { PaymentInDto, PaymentsFilter } from './dto';
import Payment from './entity/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private consistencyService: ConsistencyService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getPaymentsByItemIds(
    itemIds: number[],
    filter: PaymentsFilter,
  ): Promise<Map<number, Payment[]>> {
    const { dateFrom, dateTo } = filter || {};

    const payments = await this.prisma.payment.findMany({
      where: {
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
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
    dto: PaymentInDto,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Payment> {
    const payment = await tx.payment.create({
      data: {
        ...dto,
        item: {
          connect: {
            id: item.id,
          },
        },
      },
    });

    await this.eventEmitter.emitAsync('payment.created', {
      actorId: currentUser.id,
      payment,
      tx,
      workspaceId: item.workspaceId,
    });

    return payment;
  }

  async updatePayment(
    payment: Payment,
    dto: PaymentInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Payment> {
    return tx.payment.update({
      data: {
        cost: dto.cost,
        currency: dto.currency,
        date: dto.date,
        title: dto.title,
      },
      where: { id: payment.id },
    });
  }

  async deletePayment(payment: Payment, tx: Prisma.TransactionClient = this.prisma) {
    await tx.payment.delete({
      where: { id: payment.id },
    });
  }

  async getItemPayments(itemId: number, filter: PaymentsFilter): Promise<Payment[]> {
    const { dateFrom, dateTo } = filter || {};

    const payments = await this.prisma.payment.findMany({
      where: {
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
        itemId,
      },
    });

    return payments;
  }

  filterPayments<T extends PaymentLike>(payments: T[], filters: PaymentsFilter): T[] {
    const { dateFrom, dateTo } = filters || {};

    return payments.filter(({ date }) => {
      return (dateFrom ? dateFrom <= date : true) && (dateTo ? dateTo > date : true);
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
