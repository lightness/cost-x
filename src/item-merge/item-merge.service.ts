import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Item from '../item/entities/item.entity';
import { ConsistencyService } from '../consistency/consistency.service';

@Injectable()
export class ItemMergeService {
  constructor(
    private prisma: PrismaService,
    private consistencyService: ConsistencyService,
  ) {}

  async merge(hostItem: Item, mergingItem: Item) {
    await this.consistencyService.itemsToSameWorkspace.ensureIsBelonging(hostItem, mergingItem);

    return await this.prisma.$transaction(async (tx) => {
      const mergingPayments = await tx.payment.findMany({
        where: { itemId: mergingItem.id },
      });

      await tx.payment.createMany({
        data: mergingPayments.map(({ id, ...payment }) => ({
          ...payment,
          title: payment.title || mergingItem.title,
          itemId: hostItem.id,
        })),
      });

      await tx.itemTag.deleteMany({
        where: { itemId: mergingItem.id },
      });

      await tx.item.delete({
        where: { id: mergingItem.id },
      });

      return tx.item.findUnique({ where: { id: hostItem.id } })
    });
  }
}
