import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { TagsByItemIdLoader } from '../../item-tag/dataloaders/tags-by-item-id.loader.service';
import type { PaymentsByItemIdLoader } from '../../payment/dataloaders/payments-by-item-id.loader.service';
import type { PaymentsFilter } from '../../payment/dto';
import Payment from '../../payment/entities/payment.entity';
import type { PaymentService } from '../../payment/payment.service';
import { PaymentsAggregation } from '../../payments-aggregation/entities/payments-aggregation.entity';
import Tag from '../../tag/entities/tag.entity';
import type { ItemsFilter } from '../dto';
import Item from '../entities/item.entity';
import type { ItemService } from '../item.service';

@Resolver(() => Item)
export class ItemResolver {
  constructor(
    private itemService: ItemService,
    private paymentService: PaymentService,
    private paymentsByItemIdLoader: PaymentsByItemIdLoader,
    private tagsByItemIdLoader: TagsByItemIdLoader,
  ) {}

  @Query(() => Item)
  async item(@Args('id', { type: () => Int }) id: number) {
    return this.itemService.getById(id);
  }

  @Query(() => [Item])
  async items(
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    const items = await this.itemService.list(itemsFilter, paymentsFilter);

    return items;
  }

  @ResolveField(() => [Payment])
  async payments(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Payment[]> {
    const allPayments = await this.paymentsByItemIdLoader
      .withOptions(paymentsFilter)
      .load(item.id);
    const payments = this.paymentService.filterPayments(
      allPayments,
      paymentsFilter,
    );

    return payments;
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() item: Item) {
    return this.tagsByItemIdLoader.load(item.id);
  }

  @ResolveField(() => PaymentsAggregation)
  async paymentsAggregation(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return {
      itemIds: [item.id],
      paymentsFilter,
    };
  }
}
