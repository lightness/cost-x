import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ItemTagWhereInput } from '../../generated/prisma/models';
import { ConsistencyService } from '../consistency/consistency.service';
import { ItemsFilter } from '../item/dto';
import Item from '../item/entity/item.entity';
import { PaymentsFilter } from '../payment/dto';
import { PrismaService } from '../prisma/prisma.service';
import Tag from '../tag/entity/tag.entity';
import ItemTag from './entity/item-tag.entity';

@Injectable()
export class ItemTagService {
  constructor(
    private prisma: PrismaService,
    private consistencyService: ConsistencyService,
  ) {}

  async findByTagIds(
    tagIds: number[],
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): Promise<ItemTag[]> {
    const itemTags = await this.prisma.itemTag.findMany({
      include: {
        item: true,
      },
      where: this.getWhereClause(tagIds, itemsFilter, paymentsFilter),
    });

    return itemTags;
  }

  async assignTag(
    item: Item,
    tag: Tag,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<ItemTag> {
    await this.consistencyService.itemAndTagToSameWorkspace.ensureIsBelonging(
      item,
      tag,
    );

    const itemTag = await tx.itemTag.findUnique({
      where: {
        itemId_tagId: {
          itemId: item.id,
          tagId: tag.id,
        },
      },
    });

    if (itemTag) {
      throw new BadRequestException(
        `Item #${item.id} already has tag #${tag.id}`,
      );
    }

    return tx.itemTag.create({
      data: {
        item: { connect: { id: item.id } },
        tag: { connect: { id: tag.id } },
      },
    });
  }

  async unassignTag(
    item: Item,
    tag: Tag,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await this.consistencyService.itemAndTagToSameWorkspace.ensureIsBelonging(
      item,
      tag,
    );

    const itemTag = await tx.itemTag.findUnique({
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

    await tx.itemTag.delete({
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
      item: {
        payment: withPayments
          ? { some: { date: { gte: paymentDateFrom, lte: paymentDateTo } } }
          : undefined,
        title: title ? { contains: title, mode: 'insensitive' } : undefined,
      },
      tagId: { in: tagIds },
    };
  }
}
