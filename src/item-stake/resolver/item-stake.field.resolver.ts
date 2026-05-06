import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ItemByIdLoader } from '../../item/dataloader/item-by-id.loader.service';
import Item from '../../item/entity/item.entity';
import ItemStake from '../entity/item-stake.entity';

@Resolver(() => ItemStake)
export class ItemStakeFieldResolver {
  constructor(private itemByIdLoader: ItemByIdLoader) {}

  @ResolveField(() => Item)
  async item(@Parent() itemStake: ItemStake) {
    return this.itemByIdLoader.load(itemStake.itemId);
  }
}
