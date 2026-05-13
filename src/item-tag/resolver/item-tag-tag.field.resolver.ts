import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { TagByIdLoader } from '../../tag/dataloader/tag-by-id.loader.service';
import Tag from '../../tag/entity/tag.entity';
import ItemTag from '../entity/item-tag.entity';

@Resolver(() => ItemTag)
export class ItemTagTagFieldResolver {
  constructor(private tagByIdLoader: TagByIdLoader) {}

  @ResolveField(() => Tag)
  async tag(@Parent() itemTag: ItemTag) {
    return this.tagByIdLoader.load(itemTag.tagId);
  }
}
