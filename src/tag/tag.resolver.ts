import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ItemsByTagIdLoader } from '../item-tag/dataloaders/items-by-tag-id.loader.service';
import { FindTagsArgs } from './dto/find-tags.args';
import Tag from './entities/tag.entity';
import { TagService } from './tag.service';

@Resolver(() => Tag)
export class TagResolver {
  constructor(
    private tagService: TagService,
    private itemsByTagIdLoader: ItemsByTagIdLoader,
  ) {}

  @Query(() => Tag)
  async tag(@Args('id', { type: () => Int }) id: number) {
    return this.tagService.getById(id);
  }

  @Query(() => [Tag])
  async tags(@Args() args: FindTagsArgs) {
    return this.tagService.list(args.filter);
  }

  @ResolveField(() => [Tag])
  async items(@Parent() tag: Tag) {
    return this.itemsByTagIdLoader.load(tag.id);
  }

  // @ResolveField(() => Float)
  // async costInDefaultCurrency(
  //   @Parent() tag: TagEntity,
  //   @Context() { loaders }: { loaders: IDataloaders },
  // ) {
  //   const items = await loaders.itemsByTagIdLoader.load(tag.id);
  //   const payments2d = await loaders.paymentsByItemIdLoader.loadMany(items.map(({ id }) => id));
  //   const payments = payments2d.filter((item) => Array.isArray(item)).flat();

  //   const dto = await this.defaultCurrencyCostService.getCostInDefaultCurrency(payments);

  //   return dto.cost;
  // }
}
