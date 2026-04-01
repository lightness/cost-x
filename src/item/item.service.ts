import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { ItemWhereInput } from '../../generated/prisma/models';
import { PaymentsFilter } from '../payment/dto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../user/entity/user.entity';
import { ItemInDto, ItemsFilter } from './dto';
import Item from './entity/item.entity';
import { ItemNotFoundError } from './error';

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

  async list(
    workspaceIds: number[],
    itemsFilter: ItemsFilter,
    paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    return this.prisma.item.findMany({
      where: this.getWhereClause(workspaceIds, itemsFilter, paymentsFilter),
    });
  }

  async create(
    workspaceId: number,
    dto: ItemInDto,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Item> {
    const item = await tx.item.create({
      data: {
        title: dto.title,
        workspace: {
          connect: {
            id: workspaceId,
          },
        },
      },
    });

    await this.eventEmitter.emitAsync('item.created', {
      actorId: currentUser.id,
      item,
      tx,
      workspaceId,
    });

    return item;
  }

  async update(
    itemId: number,
    dto: ItemInDto,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Item> {
    const existingItem = await this.prisma.item.findUnique({ where: { id: itemId } });

    if (!existingItem) {
      throw new ItemNotFoundError(`Item with id ${itemId} not found`);
    }

    const updatedItem = await this.prisma.item.update({
      data: {
        title: dto.title,
      },
      where: {
        id: itemId,
      },
    });

    await this.eventEmitter.emitAsync('item.updated', {
      actorId: currentUser.id,
      newItem: updatedItem,
      oldItem: existingItem,
      tx,
      workspaceId: existingItem.workspaceId,
    });

    return updatedItem;
  }

  async delete(
    itemId: number,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const existingItem = await this.prisma.item.findUnique({ where: { id: itemId } });

    if (!existingItem) {
      throw new ItemNotFoundError(`Item with id ${itemId} not found`);
    }

    await this.prisma.item.delete({
      where: { id: itemId },
    });

    await this.eventEmitter.emitAsync('item.deleted', {
      actorId: currentUser.id,
      item: existingItem,
      tx,
      workspaceId: existingItem.workspaceId,
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
