import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import Item from '../../item/entity/item.entity';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';
import Tag from '../../tag/entity/tag.entity';
import { ItemsByTagIdLoader } from '../dataloader/items-by-tag-id.loader.service';

@Resolver(() => Tag)
export class TagItemsFieldResolver {
  constructor(private itemsByTagIdLoader: ItemsByTagIdLoader) {}

  @ResolveField(() => [Item])
  async items(
    @Parent() tag: Tag,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return this.itemsByTagIdLoader.withOptions({ itemsFilter, paymentsFilter }).load(tag.id);
  }
}
