import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';
import { ItemsAggregation } from '../entities/items-aggregation.entity';
import { ItemsAggregationService } from '../items-aggregation.service';
import { PaymentsAggregation } from '../../payments-aggregation/entities/payments-aggregation.entity';

@Resolver(() => ItemsAggregation)
export class ItemsAggregationResolver {
  constructor(private itemsAggregationService: ItemsAggregationService) { }

  @Query(() => ItemsAggregation)
  async itemsAggregation(
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    const itemIds = await this.itemsAggregationService.getIds(itemsFilter, paymentsFilter);

    return { itemIds, itemsFilter, paymentsFilter };
  }

  @ResolveField(() => Int)
  async count(@Parent() itemsAggregation: ItemsAggregation) {
    const { itemIds } = itemsAggregation;

    return itemIds.length;
  }

  @ResolveField(() => PaymentsAggregation)
  async paymentsAggregation(
    @Parent() itemsAggregation: ItemsAggregation,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter
  ) {
    return {
      itemIds: itemsAggregation.itemIds,
      paymentsFilter: paymentsFilter || itemsAggregation.paymentsFilter,
    };
  }
}