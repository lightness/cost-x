import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ItemByIdLoader } from '../../item/dataloader/item-by-id.loader.service';
import Item from '../../item/entity/item.entity';
import ItemTag from '../entity/item-tag.entity';

@Resolver(() => ItemTag)
export class ItemTagItemFieldResolver {
  constructor(private itemByIdLoader: ItemByIdLoader) {}

  @ResolveField(() => Item)
  async item(@Parent() itemTag: ItemTag) {
    return this.itemByIdLoader.load(itemTag.itemId);
  }
}
