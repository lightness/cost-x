import { NotFoundException } from '@nestjs/common';
import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, Payment } from '../../database/entities';
import ItemEntity from '../entities/item.entity';
import PaymentEntity from '../entities/payment.entity';
import { PaymentService } from '../services/payment.service';
import { FindPaymentsResponse, PaymentsFilter } from '../types';

@Resolver(() => PaymentEntity)
export class PaymentResolver {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    private paymentService: PaymentService,
  ) {}

  @Query(() => PaymentEntity)
  async payment(@Args('id', { type: () => Int }) id: number) {
    const payment = await this.paymentRepository.findOneBy({ id });

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

  @ResolveField(() => ItemEntity)
  async item(@Parent() payment: PaymentEntity) {
    const { itemId } = payment;

    const item = await this.itemRepository.findOneBy({ id: itemId });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    return item;
  }
}