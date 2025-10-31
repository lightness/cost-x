import { Args, Float, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Item, Payment } from '../../database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DefaultCurrencyCostService } from '../../item-cost/default-currency-cost.service';

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    private defaultCurrencyCostService: DefaultCurrencyCostService,
  ) {}

  @Query(() => Payment)
  async payment(@Args('id', { type: () => Int }) id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOneBy({ id });

    if (!payment) {
      throw new NotFoundException(id);
    }

    return payment;
  }

  @Query(() => [Payment])
  async payments(): Promise<Payment[]> {
    const payments = await this.paymentRepository.find();

    return payments;
  }

  @ResolveField(() => Item)
  async item(@Parent() payment: Payment) {
    const { itemId } = payment;

    const item = await this.itemRepository.findOneBy({ id: itemId });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    return item;
  }

  @ResolveField(() => Float)
  async costInDefaultCurrency(@Parent() payment: Payment) {
    const dto = await this.defaultCurrencyCostService.getCostInDefaultCurrency([payment]);

    return dto.cost;
  }

}