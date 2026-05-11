import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { ItemWhereInput } from '../../generated/prisma/models';
import { PaymentsFilter } from '../payment/dto';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { Workspace } from '../workspace/entity/workspace.entity';
import { ItemInDto, ItemsFilter } from './dto';
import Item from './entity/item.entity';

@Injectable()
export class ItemService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getById(id: number): Promise<Item> {
    const item = await this.prisma.item.findUnique({ where: { id } });

    return item;
  }

  async listByWorkspaceIds(
    workspaceIds: number[],
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    return this.prisma.item.findMany({
      where: this.getWhereClause(workspaceIds, itemsFilter, paymentsFilter),
    });
  }

  async list(itemsFilter: ItemsFilter): Promise<Item[]> {
    return this.prisma.item.findMany({
      where: this.getWhereClause([], itemsFilter, {}),
    });
  }

  async create(
    workspace: Workspace,
    dto: ItemInDto,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Item> {
    const item = await tx.item.create({
      data: {
        stakeRule: workspace.stakeRule,
        title: dto.title,
        workspace: {
          connect: {
            id: workspace.id,
          },
        },
      },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.ITEM_CREATED, {
      actorId: currentUser.id,
      item,
      tx,
      workspaceId: workspace.id,
    });

    return item;
  }

  async update(
    item: Item,
    patch: Partial<Pick<Item, 'title'>>,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Item> {
    const updatedItem = await tx.item.update({
      data: {
        title: patch.title || item.title,
      },
      where: {
        id: item.id,
      },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.ITEM_UPDATED, {
      actorId: currentUser.id,
      newItem: updatedItem,
      oldItem: item,
      tx,
      workspaceId: item.workspaceId,
    });

    return updatedItem;
  }

  async delete(
    item: Item,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await tx.item.delete({
      where: { id: item.id },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.ITEM_DELETED, {
      actorId: currentUser.id,
      item: item,
      tx,
      workspaceId: item.workspaceId,
    });
  }

  // private

  private getWhereClause(
    workspaceIds: number[],
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): ItemWhereInput {
    const { title, tagIds, ids: itemIds } = itemsFilter;
    const { dateFrom: paymentDateFrom, dateTo: paymentDateTo, ids: paymentIds } = paymentsFilter;

    const withTagIds = (tagIds || []).length > 0;
    const withPaymentIdFilter = (paymentIds || []).length > 0;
    const withPaymentFilter =
      Boolean(paymentDateFrom) || Boolean(paymentDateTo) || withPaymentIdFilter;

    return {
      id: itemIds ? { in: itemIds } : undefined,
      itemTag: withTagIds ? { some: { tagId: { in: tagIds } } } : undefined,
      payment: withPaymentFilter
        ? {
            some: {
              date: { gte: paymentDateFrom, lte: paymentDateTo },
              id: withPaymentIdFilter ? { in: paymentIds } : undefined,
            },
          }
        : undefined,
      title: title ? { contains: title, mode: 'insensitive' } : undefined,
      workspaceId: workspaceIds.length > 0 ? { in: workspaceIds } : undefined,
    };
  }
}
