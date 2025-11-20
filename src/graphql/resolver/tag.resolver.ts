import { Args, Context, Float, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Item, Tag } from '../../database/entities';
import { TagService } from '../../tag/tag.service';
import { FindTagsArgs } from '../args/find-tags.args';
import { IDataloaders } from '../dataloader/interfaces';
import { DefaultCurrencyCostService } from '../../item-cost/default-currency-cost.service';

@Resolver(() => Tag)
export class TagResolver {
  constructor(private tagService: TagService, private defaultCurrencyCostService: DefaultCurrencyCostService) {}

  @Query(() => Tag)
  async tag(@Args('id', { type: () => Int }) id: number): Promise<Tag> {
    return this.tagService.getById(id);
  }

  @Query(() => [Tag])
  async tags(@Args() args: FindTagsArgs): Promise<Tag[]> {
    return this.tagService.list(args.filter);
  }

  @ResolveField(() => [Item])
  async items(
    @Parent() tag: Tag,
    @Context() { loaders }: { loaders: IDataloaders },
  ) {
    return loaders.itemsByTagIdLoader.load(tag.id);
  }

  @ResolveField(() => Float)
  async costInDefaultCurrency(
    @Parent() tag: Tag,
    @Context() { loaders }: { loaders: IDataloaders },
  ) {
    const items = await loaders.itemsByTagIdLoader.load(tag.id);
    const payments2d = await loaders.paymentsByItemIdLoader.loadMany(items.map(({ id }) => id));
    const payments = payments2d.filter((item) => Array.isArray(item)).flat();

    const dto = await this.defaultCurrencyCostService.getCostInDefaultCurrency(payments);

    return dto.cost;

  }
}