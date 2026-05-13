import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import Item from '../entity/item.entity';

@Injectable({ scope: Scope.REQUEST })
export class ItemByPaymentIdLoader extends BaseLoader<number, Item> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(paymentIds: number[]): Promise<Item[]> {
    const payments = await this.prisma.payment.findMany({
      include: { item: true },
      where: { id: { in: paymentIds } },
    });

    const paymentById = this.groupService.mapBy(payments, 'id');

    return paymentIds.map((paymentId) => paymentById.get(paymentId)?.item ?? null);
  }
}
