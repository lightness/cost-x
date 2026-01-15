import { Injectable } from '@nestjs/common';
import { ItemsFilter } from '../item/dto';
import { PaymentsFilter } from '../payment/dto';
import { PrismaService } from '../prisma/prisma.service';
import { ItemWhereInput } from '../../generated/prisma/models';

@Injectable()
export class ItemsAggregationService {
  constructor(private prisma: PrismaService) {}

  async getIds(
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): Promise<number[]> {
    const rows = await this.prisma.item.findMany({
      where: this.getWhereClause(itemsFilter, paymentsFilter),
      select: {
        id: true,
      },
    });

    return rows.map((row) => row.id);
  }

  // count

  async getCount(
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): Promise<number> {
    const count = await this.prisma.item.count({
      where: this.getWhereClause(itemsFilter, paymentsFilter),
    });

    return count;
  }

  // other

  private getWhereClause(
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): ItemWhereInput {
    const { title, tagIds } = itemsFilter;
    const { dateFrom: paymentDateFrom, dateTo: paymentDateTo } = paymentsFilter;

    const withTagIds = (tagIds || []).length > 0;
    const withPayments = Boolean(paymentDateFrom || paymentDateTo);

    return {
      title: title ? { contains: title, mode: 'insensitive' } : undefined,
      itemTag: withTagIds ? { some: { tagId: { in: tagIds } } } : undefined,
      payment: withPayments
        ? { some: { date: { gte: paymentDateFrom, lte: paymentDateTo } } }
        : undefined,
    };
  }
}
