import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ItemsByTagIdLoader } from '../../item-tag/dataloader/items-by-tag-id.loader.service';
import { ItemsFilter } from '../../item/dto';
import { ItemsAggregationsByTagIdLoader } from '../../items-aggregation/dataloader/items-aggregations-by-tag-id.loader.service';
import { ItemsAggregation } from '../../items-aggregation/entity/items-aggregation.entity';
import { PaymentsFilter } from '../../payment/dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../../workspace/entity/workspace.entity';
import Tag from '../entity/tag.entity';

@Resolver(() => Tag)
export class TagFieldResolver {
  constructor(
    private prisma: PrismaService,
    private itemsByTagIdLoader: ItemsByTagIdLoader,
    private itemsAggregationsByTagIdLoader: ItemsAggregationsByTagIdLoader,
  ) {}

  @ResolveField(() => Workspace)
  async workspace(@Parent() tag: Tag) {
    return this.prisma.workspace.findUnique({ where: { id: tag.workspaceId } });
  }

  @ResolveField(() => [Tag])
  async items(
    @Parent() tag: Tag,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return this.itemsByTagIdLoader.withOptions({ itemsFilter, paymentsFilter }).load(tag.id);
  }

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
