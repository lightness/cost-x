import { NotFoundException } from '@nestjs/common';
import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { FindPaymentsResponse, PaymentsFilter } from './dto';
import { PaymentService } from './payment.service';
import Payment from './entities/payment.entity';
import Item from '../item/entities/item.entity';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  @Query(() => Payment)
  async payment(@Args('id', { type: () => Int }) id: number) {
    const payment = await this.prisma.payment.findFirst({ where: { id } });

    if (!payment) {
      throw new NotFoundException(id);
    }

    return payment;
  }

  @Query(() => FindPaymentsResponse)
  async payments(
    @Args('paymentsFilter', { nullable: true }) filter: PaymentsFilter,
  ) {
    const payments = await this.paymentService.list(filter);

    return { data: payments };
  }

  @ResolveField(() => Item)
  async item(@Parent() payment: Payment) {
    const { itemId } = payment;

    const item = await this.prisma.item.findFirst({ where: { id: itemId } });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    return item;
  }
}