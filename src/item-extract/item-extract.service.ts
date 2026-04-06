import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import Item from '../item/entity/item.entity';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import {
  ExtractAllPaymentsError,
  ExtractPaymentsEmptyError,
  PaymentNotBelongToItemError,
} from './error';

@Injectable()
export class ItemExtractService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async extractAsItem(
    sourceItem: Item,
    paymentIds: number[],
    title: string,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    if (paymentIds.length === 0) {
      throw new ExtractPaymentsEmptyError();
    }

    const allPayments = await tx.payment.findMany({
      where: { itemId: sourceItem.id },
    });

    const allPaymentIdSet = new Set(allPayments.map((p) => p.id));
    const invalidIds = paymentIds.filter((id) => !allPaymentIdSet.has(id));

    if (invalidIds.length > 0) {
      throw new PaymentNotBelongToItemError(invalidIds);
    }

    if (paymentIds.length === allPayments.length) {
      throw new ExtractAllPaymentsError();
    }

    const extractedItem = await tx.item.create({
      data: {
        title,
        workspaceId: sourceItem.workspaceId,
      },
    });

    await tx.payment.updateMany({
      data: { itemId: extractedItem.id },
      where: { id: { in: paymentIds } },
    });

    const sourceTags = await tx.itemTag.findMany({
      where: { itemId: sourceItem.id },
    });

    if (sourceTags.length > 0) {
      await tx.itemTag.createMany({
        data: sourceTags.map(({ tagId }) => ({
          itemId: extractedItem.id,
          tagId,
        })),
      });
    }

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.ITEM_EXTRACTED, {
      actorId: currentUser.id,
      extractedItem,
      sourceItem,
      tx,
      workspaceId: sourceItem.workspaceId,
    });

    return extractedItem;
  }
}
