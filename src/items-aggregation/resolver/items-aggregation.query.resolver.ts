import { Args, Query, Resolver } from '@nestjs/graphql';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';
import { ItemsAggregation } from '../entity/items-aggregation.entity';
import { ItemsAggregationService } from '../items-aggregation.service';

@Resolver()
export class ItemsAggregationQueryResolver {
  constructor(private itemsAggregationService: ItemsAggregationService) {}

  @Query(() => ItemsAggregation)
  async itemsAggregation(
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    const itemIds = await this.itemsAggregationService.getIds(itemsFilter, paymentsFilter);

    return { itemIds, itemsFilter, paymentsFilter };
  }
}
