import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import Item from '../../item/entity/item.entity';
import Tag from '../../tag/entity/tag.entity';
import { TagsByItemIdLoader } from '../dataloader/tags-by-item-id.loader.service';

@Resolver(() => Item)
export class ItemTagsFieldResolver {
  constructor(private tagsByItemIdLoader: TagsByItemIdLoader) {}

  @ResolveField(() => [Tag])
  async tags(@Parent() item: Item) {
    return this.tagsByItemIdLoader.load(item.id);
  }
}
