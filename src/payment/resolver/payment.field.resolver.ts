import { NotFoundException } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import Item from '../../item/entity/item.entity';
import { PrismaService } from '../../prisma/prisma.service';
import Payment from '../entity/payment.entity';

@Resolver(() => Payment)
export class PaymentFieldResolver {
  constructor(private prisma: PrismaService) {}

  @ResolveField(() => Item)
  async item(@Parent() payment: Payment) {
    const item = await this.prisma.item.findFirst({ where: { id: payment.itemId } });

    if (!item) {
      throw new NotFoundException(`Item with ID ${payment.itemId} not found`);
    }

    return item;
  }
}
