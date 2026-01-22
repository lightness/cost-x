import { Injectable } from '@nestjs/common';
import { ItemsFilter } from '../item/dto';
import { PaymentsFilter } from '../payment/dto';
import { PrismaService } from '../prisma/prisma.service';
import { ItemWhereInput } from '../../generated/prisma/models';

@Injectable()
export class ItemsAggregationService {
  constructor(private prisma: PrismaService) { }

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

  async listByWorkspaceIds(
    workspaceIds: number[],
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ) {
    const items = await this.prisma.item.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        ...this.getWhereClause(itemsFilter, paymentsFilter),
      },
      select: {
          id: true,
          workspaceId: true,
        },
    });

    return items;
  }

  async getIdsGroupedByTagId(
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): Promise<Map<number, number[]>> {
    const items = await this.prisma.item.findMany({
      where: this.getWhereClause(itemsFilter, paymentsFilter),
      select: {
        id: true,
        itemTag: {
          select: {
            tagId: true,
          }
        }
      },
    });

    return new Map(
      itemsFilter.tagIds.map((tagId) => {
        const itemIds = items
          .filter(item => item.itemTag.some((itemTag) => itemTag.tagId === tagId))
          .map(item => item.id);

        return [tagId, itemIds]
      })
    );
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
