import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ItemsAggregationsByTagIdLoader } from '../dataloader/items-aggregations-by-tag-id.loader.service';
import Tag from '../../tag/entity/tag.entity';
import { ItemsAggregation } from '../entity/items-aggregation.entity';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';

@Resolver(() => Tag)
export class TagItemsAggregationFieldResolver {
  constructor(private itemsAggregationsByTagIdLoader: ItemsAggregationsByTagIdLoader) {}

  @ResolveField(() => ItemsAggregation)
  async itemsAggregation(
    @Parent() tag: Tag,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return this.itemsAggregationsByTagIdLoader
      .withOptions({ itemsFilter, paymentsFilter })
      .load(tag.id);
  }
}
