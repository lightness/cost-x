import { Args, Context, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { TagService } from '../../tag/tag.service';
import { IDataloaders } from '../dataloaders/interfaces';
import ItemEntity from '../entities/item.entity';
import TagEntity from '../entities/tag.entity';
import { FindTagsArgs } from '../types/find-tags.args';

@Resolver(() => TagEntity)
export class TagResolver {
  constructor(
    private tagService: TagService, 
    // private defaultCurrencyCostService: DefaultCurrencyCostService,
  ) {}

  @Query(() => TagEntity)
  async tag(@Args('id', { type: () => Int }) id: number) {
    return this.tagService.getById(id);
  }

  @Query(() => [TagEntity])
  async tags(@Args() args: FindTagsArgs) {
    return this.tagService.list(args.filter);
  }

  @ResolveField(() => [ItemEntity])
  async items(
    @Parent() tag: TagEntity,
    @Context() { loaders }: { loaders: IDataloaders },
  ) {
    return loaders.itemsByTagIdLoader.load(tag.id);
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