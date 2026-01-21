import { BadRequestException, Injectable } from '@nestjs/common';
import { ItemTagWhereInput } from '../../generated/prisma/models';
import { ItemsFilter } from '../item/dto';
import Item from '../item/entities/item.entity';
import { PaymentsFilter } from '../payment/dto';
import { PrismaService } from '../prisma/prisma.service';
import Tag from '../tag/entities/tag.entity';
import ItemTag from './entities/item-tag.entity';

@Injectable()
export class ItemTagService {
  constructor(private prisma: PrismaService) { }

  async findByTagIds(tagIds: number[], itemsFilter: ItemsFilter, paymentsFilter: PaymentsFilter): Promise<ItemTag[]> {
    const itemTags = await this.prisma.itemTag.findMany({
      where: this.getWhereClause(tagIds, itemsFilter, paymentsFilter),
      include: {
        item: true,
      },
    });

    return itemTags;
  }

  async setTag(item: Item, tag: Tag): Promise<ItemTag> {
    const itemTag = await this.prisma.itemTag.findFirst({
      where: {
        itemId: item.id,
        tagId: tag.id,
      },
    });

    if (itemTag) {
      throw new BadRequestException(
        `Item #${item.id} already has tag #${tag.id}`,
      );
    }

    return this.prisma.itemTag.create({
      data: {
        item: { connect: { id: item.id } },
        tag: { connect: { id: tag.id } },
      },
    });
  }

  async removeTag(item: Item, tag: Tag): Promise<void> {
    const itemTag = await this.prisma.itemTag.findUnique({
      where: {
        itemId_tagId: {
          itemId: item.id,
          tagId: tag.id,
        },
      },
    });

    if (!itemTag) {
      throw new BadRequestException(
        `Item #${item.id} does not have tag #${tag.id}`,
      );
    }

    await this.prisma.itemTag.delete({
      where: {
        itemId_tagId: {
          itemId: item.id,
          tagId: tag.id,
        },
      },
    });
  }

  // private

  private getWhereClause(
    tagIds: number[],
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): ItemTagWhereInput {
    const { title } = itemsFilter;
    const { dateFrom: paymentDateFrom, dateTo: paymentDateTo } = paymentsFilter;

    const withPayments = Boolean(paymentDateFrom || paymentDateTo);

    return {
      tagId: { in: tagIds },
      item: {
        title: title ? { contains: title, mode: 'insensitive' } : undefined,
        payment: withPayments
          ? { some: { date: { gte: paymentDateFrom, lte: paymentDateTo } } }
          : undefined,
      }
    };
  }
}
