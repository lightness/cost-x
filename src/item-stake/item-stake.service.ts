import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import Item from '../item/entity/item.entity';
import { PrismaService } from '../prisma/prisma.service';
import { MemberStake } from './dto';
import ItemStake from './entity/item-stake.entity';

@Injectable()
export class ItemStakeService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdate(
    item: Item,
    stake: MemberStake,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<ItemStake> {
    return tx.itemStake.upsert({
      create: {
        item: { connect: { id: item.id } },
        value: stake.value,
        workspaceMember: { connect: { id: stake.workspaceMemberId } },
      },
      update: {
        value: stake.value,
      },
      where: {
        itemId_workspaceMemberId: {
          itemId: item.id,
          workspaceMemberId: stake.workspaceMemberId,
        },
      },
    });
  }

  async bulkCreateOrUpdate(
    item: Item,
    stakes: MemberStake[],
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<ItemStake[]> {
    return Promise.all(stakes.map((stake) => this.createOrUpdate(item, stake, tx)));
  }

  async bulkDelete(item: Item, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    await tx.itemStake.deleteMany({
      where: { itemId: item.id },
    });
  }

  async getByItemId(
    itemId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<ItemStake[]> {
    return tx.itemStake.findMany({ where: { itemId } });
  }
}
