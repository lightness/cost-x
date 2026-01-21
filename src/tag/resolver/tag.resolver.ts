import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { AccessScope } from '../../access/interfaces';
import { UserRole } from '../../user/entities/user-role.enum';
import { TagsFilter } from '../dto';
import Tag from '../entities/tag.entity';
import { TagService } from '../tag.service';
import { fromArg } from '../../access/function/from-arg.function';
import { ItemsByTagIdLoader } from '../../item-tag/dataloaders/items-by-tag-id.loader.service';
import { ItemsAggregation } from '../../items-aggregation/entities/items-aggregation.entity';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';
import { ItemsAggregationService } from '../../items-aggregation/items-aggregation.service';

@Resolver(() => Tag)
export class TagResolver {
  constructor(
    private tagService: TagService,
    private itemsByTagIdLoader: ItemsByTagIdLoader,
    private itemsAggregationService: ItemsAggregationService,
  ) {}

  @ResolveField(() => [Tag])
  async items(
    @Parent() tag: Tag,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return this.itemsByTagIdLoader
      .withOptions({ itemsFilter, paymentsFilter })
      .load(tag.id);
  }

  @ResolveField(() => ItemsAggregation)
  async itemsAggregation(
    @Parent() tag: Tag,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    const itemIds = await this.itemsAggregationService.getIds(
      { ...itemsFilter, tagIds: [tag.id] },
      paymentsFilter,
    );

    return { itemIds, paymentsFilter, itemsFilter }
  }

  @Query(() => [Tag])
  @Access.allow([
    {
      targetScope: AccessScope.WORKSPACE,
      targetId: fromArg('workspaceId'),
      role: [UserRole.USER],
    },
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
  ])
  async tags(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { nullable: true }) dto: TagsFilter,
  ): Promise<Tag[]> {
    return this.tagService.list(workspaceId, dto);
  }

  @Query(() => Tag)
  @Access.allow([
    {
      targetScope: AccessScope.TAG,
      targetId: fromArg('id'),
      role: [UserRole.USER],
    },
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
  ])
  async tag(@Args('id', { type: () => Int }) id: number): Promise<Tag> {
    return this.tagService.getById(id);
  }
}
