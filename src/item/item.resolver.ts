import { Args, Context, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import Item from './entities/item.entity';
import { ItemService } from './item.service';
import { PaymentService } from '../payment/payment.service';
import { FindItemsResponse, ItemsFilter } from './dto';
import { Tag } from '../database/entities';
import { FindPaymentsResponse, PaymentsFilter } from '../payment/dto';
import { PaymentsByItemIdLoader } from '../payment/dataloaders/payments-by-item-id.loader.service';
import { TagsByItemIdLoader } from '../item-tag/dataloaders/tags-by-item-id.loader.service';
import { PaymentsAggregation } from '../payments-aggregation/entities/payments-aggregation.entity';

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

  @Query(() => FindItemsResponse)
  async items(
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
    @Context() context,
  ): Promise<{}> {
    context.itemsFilter = itemsFilter;
    context.paymentsFilter = paymentsFilter;

    const items = await this.itemService.list({
      ...itemsFilter,
      paymentDateFrom: paymentsFilter.dateFrom,
      paymentDateTo: paymentsFilter.dateTo,
    });

    return { data: items };
  }

  @ResolveField(() => FindPaymentsResponse)
  async payments(
    @Parent() item: Item,
    @Context('paymentsFilter') paymentsFilter: PaymentsFilter,
  ) {
    const allPayments = await this.paymentsByItemIdLoader.load(item.id);
    const payments = this.paymentService.filterPayments(allPayments, paymentsFilter);

    return { data: payments };
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
