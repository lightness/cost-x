import { Args, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsAggregation } from '../../payments-aggregation/entity/payments-aggregation.entity';
import { ItemsAggregation } from '../entity/items-aggregation.entity';

@Resolver(() => ItemsAggregation)
export class ItemsAggregationFieldResolver {
  @ResolveField(() => Int)
  async count(@Parent() itemsAggregation: ItemsAggregation) {
    const { itemIds } = itemsAggregation;

    return itemIds.length;
  }

  @ResolveField(() => PaymentsAggregation)
  async paymentsAggregation(
    @Parent() itemsAggregation: ItemsAggregation,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return {
      itemIds: itemsAggregation.itemIds,
      paymentsFilter: paymentsFilter || itemsAggregation.paymentsFilter,
    };
  }
}
