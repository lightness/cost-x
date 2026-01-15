import { Injectable } from '@nestjs/common';
import type { ItemWhereInput } from '../../generated/prisma/models';
import type { PaymentsFilter } from '../payment/dto';
import type { PrismaService } from '../prisma/prisma.service';
import type { ItemInDto, ItemsFilter } from './dto';
import type Item from './entities/item.entity';

@Injectable()
export class ItemService {
  constructor(private prisma: PrismaService) {}

  async getById(id: number): Promise<Item> {
    const item = await this.prisma.item.findUnique({ where: { id } });

    return item;
  }

  async list(
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    return this.prisma.item.findMany({
      where: this.getWhereClause(itemsFilter, paymentsFilter),
    });
  }

  async create(dto: ItemInDto): Promise<Item> {
    const item = await this.prisma.item.create({ data: dto });

    return item;
  }

  async update(item: Item, dto: ItemInDto): Promise<Item> {
    return this.prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        title: dto.title,
      },
    });
  }

  async delete(item: Item): Promise<void> {
    await this.prisma.item.delete({
      where: { id: item.id },
    });
  }

  // private

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
