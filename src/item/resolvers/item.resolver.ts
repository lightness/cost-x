import { Args, Context, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Payment, Tag } from '../../database/entities';
import { TagsByItemIdLoader } from '../../item-tag/dataloaders/tags-by-item-id.loader.service';
import { PaymentsByItemIdLoader } from '../../payment/dataloaders/payments-by-item-id.loader.service';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentService } from '../../payment/payment.service';
import { PaymentsAggregation } from '../../payments-aggregation/entities/payments-aggregation.entity';
import { ItemsFilter } from '../dto';
import Item from '../entities/item.entity';
import { ItemService } from '../item.service';

@Resolver(() => Item)
export class ItemResolver {
  constructor(
    private itemService: ItemService,
    private paymentService: PaymentService,
    private paymentsByItemIdLoader: PaymentsByItemIdLoader,
    private tagsByItemIdLoader: TagsByItemIdLoader,
  ) { }

  @Query(() => Item)
  async item(@Args('id', { type: () => Int }) id: number) {
    return this.itemService.getById(id);
  }

  @Query(() => [Item])
  async items(
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    const items = await this.itemService.list({
      ...itemsFilter,
      paymentDateFrom: paymentsFilter.dateFrom,
      paymentDateTo: paymentsFilter.dateTo,
    });

    return items;
  }

  @ResolveField(() => [Payment])
  async payments(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Payment[]> {
    const allPayments = await this.paymentsByItemIdLoader.load(item.id);
    const payments = this.paymentService.filterPayments(allPayments, paymentsFilter);

    return payments;
  }

  @ResolveField(() => [Tag])
  async tags(
    @Parent() item: Item,
  ) {
    return this.tagsByItemIdLoader.load(item.id);
  }

  @ResolveField(() => PaymentsAggregation)
  async paymentsAggregation(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter
  ) {
    return {
      itemId: item.id,
      paymentsFilter,
    };
  }
}
