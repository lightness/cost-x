import { BadRequestException, Injectable } from '@nestjs/common';
import { cmp } from 'type-comparator';
import { ConsistencyService } from '../consistency/consistency.service';
import { PaymentLike } from '../item-cost/interfaces';
import Item from '../item/entities/item.entity';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentInDto, PaymentsFilter } from './dto';
import Payment from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private consistencyService: ConsistencyService,
  ) {}

  async getPaymentsByItemIds(
    itemIds: number[],
    filter: PaymentsFilter,
  ): Promise<Map<number, Payment[]>> {
    const { dateFrom, dateTo } = filter || {};

    const payments = await this.prisma.payment.findMany({
      where: {
        itemId: { in: itemIds },
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
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
      throw new BadRequestException(
        `Payment #${payment.id} does not belong to item #${item.id}`,
      );
    }

    return payment;
  }

  async createPayment(item: Item, dto: PaymentInDto): Promise<Payment> {
    return this.prisma.payment.create({ 
      data: { 
        ...dto, 
        item: { connect: item }  
      },
      
    });
  }

  async updatePayment(
    payment: Payment,
    dto: PaymentInDto,
  ): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        title: dto.title,
        cost: dto.cost,
        currency: dto.currency,
        date: dto.date,
      },
    });
  }

  async deletePayment(payment: Payment) {
    await this.prisma.payment.delete({
      where: { id: payment.id },
    });
  }

  async getItemPayments(itemId: number, filter: PaymentsFilter): Promise<Payment[]> {
    const { dateFrom, dateTo } = filter || {};

    const payments = await this.prisma.payment.findMany({
      where: {
        itemId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    });

    return payments;
  }

  filterPayments<T extends PaymentLike>(
    payments: T[],
    filters: PaymentsFilter,
  ): T[] {
    const { dateFrom, dateTo } = filters || {};

    return payments.filter(({ date }) => {
      return (
        (dateFrom ? dateFrom <= date : true) && (dateTo ? dateTo > date : true)
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
