import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import Item from '../../item/entity/item.entity';
import { ItemStakesByItemIdLoader } from '../dataloader/item-stakes-by-item-id.loader.service';
import ItemStake from '../entity/item-stake.entity';

@Resolver(() => Item)
export class ItemItemStakesFieldResolver {
  constructor(private itemStakeByItemIdLoader: ItemStakesByItemIdLoader) {}

  @ResolveField(() => [ItemStake])
  async itemStakes(@Parent() item: Item) {
    return this.itemStakeByItemIdLoader.load(item.id);
  }
}
