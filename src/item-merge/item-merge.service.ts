import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type Item from '../item/entities/item.entity';

@Injectable()
export class ItemMergeService {
  constructor(private prisma: PrismaService) {}

  async merge(hostItem: Item, mergingItem: Item) {
    return await this.prisma.$transaction(async (tx) => {
      const mergingPayments = await tx.payment.findMany({
        where: { itemId: mergingItem.id },
      });

      await tx.payment.createMany({
        data: mergingPayments.map((payment) => ({
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

      // TODO: Refactor simplify query
      return {
        item: await tx.item.findUnique({ where: { id: hostItem.id } }),
        payments: await tx.payment.findMany({ where: { itemId: hostItem.id } }),
      };
    });
  }
}
