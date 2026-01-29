import { Injectable } from '@nestjs/common';
import { ItemWhereInput } from '../../generated/prisma/models';
import { PaymentsFilter } from '../payment/dto';
import { PrismaService } from '../prisma/prisma.service';
import { ItemInDto, ItemsFilter } from './dto';
import Item from './entity/item.entity';

@Injectable()
export class ItemService {
  constructor(private prisma: PrismaService) {}

  async getById(id: number): Promise<Item> {
    const item = await this.prisma.item.findUnique({ where: { id } });

    return item;
  }

  async list(
    workspaceIds: number[],
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    return this.prisma.item.findMany({
      where: this.getWhereClause(workspaceIds, itemsFilter, paymentsFilter),
    });
  }

  async create(workspaceId: number, dto: ItemInDto): Promise<Item> {
    const item = await this.prisma.item.create({
      data: {
        title: dto.title,
        workspace: {
          connect: {
            id: workspaceId,
          },
        },
      },
    });

    return item;
  }

  async update(itemId: number, dto: ItemInDto): Promise<Item> {
    return this.prisma.item.update({
      data: {
        title: dto.title,
      },
      where: {
        id: itemId,
      },
    });
  }

  async delete(itemId: number): Promise<void> {
    await this.prisma.item.delete({
      where: { id: itemId },
    });
  }

  // private

  private getWhereClause(
    workspaceIds: number[],
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): ItemWhereInput {
    const { title, tagIds } = itemsFilter;
    const { dateFrom: paymentDateFrom, dateTo: paymentDateTo } = paymentsFilter;

    const withTagIds = (tagIds || []).length > 0;
    const withPayments = Boolean(paymentDateFrom || paymentDateTo);

    return {
      itemTag: withTagIds ? { some: { tagId: { in: tagIds } } } : undefined,
      payment: withPayments
        ? { some: { date: { gte: paymentDateFrom, lte: paymentDateTo } } }
        : undefined,
      title: title ? { contains: title, mode: 'insensitive' } : undefined,
      workspaceId: { in: workspaceIds },
    };
  }
}
