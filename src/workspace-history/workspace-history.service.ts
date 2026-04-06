import { Injectable } from '@nestjs/common';
import { JsonObject } from '@prisma/client/runtime/client';
import { Prisma } from '../../generated/prisma/client';
import Item from '../item/entity/item.entity';
import Payment from '../payment/entity/payment.entity';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceHistoryAction } from './entity/workspace-history-action.enum';
import { WorkspaceHistory } from './entity/workspace-history.entity';

@Injectable()
export class WorkspaceHistoryService {
  constructor(private prisma: PrismaService) {}

  async listByWorkspaceId(
    workspaceId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory[]> {
    const workspaceHistoryEntries = await tx.workspaceHistory.findMany({
      orderBy: { createdAt: 'desc' },
      where: { workspaceId },
    });

    return workspaceHistoryEntries;
  }

  async create(
    data: Omit<WorkspaceHistory, 'id' | 'createdAt'>,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    const workspaceHistory = await tx.workspaceHistory.create({
      data,
    });

    return workspaceHistory;
  }

  async createItemCreated(
    workspaceId: number,
    actorId: number,
    item: Item,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_CREATED,
        actorId,
        newValue: item as unknown as JsonObject,
        oldValue: null,
        workspaceId,
      },
      tx,
    );
  }

  async createItemUpdated(
    workspaceId: number,
    actorId: number,
    oldItem: Item,
    newItem: Item,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_UPDATED,
        actorId,
        newValue: newItem as unknown as JsonObject,
        oldValue: oldItem as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createItemDeleted(
    workspaceId: number,
    actorId: number,
    item: Item,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_DELETED,
        actorId,
        newValue: null,
        oldValue: item as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createPaymentDeleted(
    workspaceId: number,
    actorId: number,
    payment: Payment,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.PAYMENT_DELETED,
        actorId,
        newValue: null,
        oldValue: payment as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createPaymentUpdated(
    workspaceId: number,
    actorId: number,
    oldPayment: Payment,
    newPayment: Payment,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.PAYMENT_UPDATED,
        actorId,
        newValue: newPayment as unknown as JsonObject,
        oldValue: oldPayment as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createPaymentCreated(
    workspaceId: number,
    actorId: number,
    payment: Payment,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.PAYMENT_CREATED,
        actorId,
        newValue: payment as unknown as JsonObject,
        oldValue: null,
        workspaceId,
      },
      tx,
    );
  }
}
