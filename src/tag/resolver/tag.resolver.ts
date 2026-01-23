import { UseGuards, UseInterceptors } from '@nestjs/common';
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { GqlLoggingInterceptor } from '../../graphql/interceptors/gql-logging.interceptor';
import { ItemsByTagIdLoader } from '../../item-tag/dataloaders/items-by-tag-id.loader.service';
import { ItemsFilter } from '../../item/dto';
import { ItemsAggregationsByTagIdLoader } from '../../items-aggregation/dataloaders/items-aggregations-by-tag-id.loader.service';
import { ItemsAggregation } from '../../items-aggregation/entities/items-aggregation.entity';
import { PaymentsFilter } from '../../payment/dto';
import { UserRole } from '../../user/entities/user-role.enum';
import { TagInDto, TagsFilter } from '../dto';
import Tag from '../entities/tag.entity';
import { TagService } from '../tag.service';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Resolver(() => Tag)
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(GqlLoggingInterceptor)
export class TagResolver {
  constructor(
    private prisma: PrismaService,
    private tagService: TagService,
    private itemsByTagIdLoader: ItemsByTagIdLoader,
    private itemsAggregationsByTagIdLoader: ItemsAggregationsByTagIdLoader,
  ) {}

  @ResolveField(() => Workspace)
  async workspace(
    @Parent() tag: Tag
  ) {
    return this.prisma.workspace.findUnique({ where: { id: tag.workspaceId } });
  }

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
    const itemsAggregation = this.itemsAggregationsByTagIdLoader
      .withOptions({ itemsFilter, paymentsFilter })
      .load(tag.id);

    return itemsAggregation;
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
    return this.tagService.listByWorkspaceIds([workspaceId], dto);
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

  @Mutation(() => Tag)
  @Access.allow([
    {
      targetScope: AccessScope.WORKSPACE,
      targetId: fromArg('workspaceId'),
      role: [UserRole.USER],
    },
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
  ])
  async createTag(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { type: () => TagInDto }) dto: TagInDto,
  ) {
    return this.tagService.create(workspaceId, dto);
  }

  @Mutation(() => Tag)
  @Access.allow([
    {
      targetScope: AccessScope.TAG,
      targetId: fromArg('id'),
      role: [UserRole.USER],
    },
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
  ])
  async updateTag(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => TagInDto }) dto: TagInDto,
  ) {
    return this.tagService.update(id, dto);
  }

  @Mutation(() => Boolean)
  @Access.allow([
    {
      targetScope: AccessScope.TAG,
      targetId: fromArg('id'),
      role: [UserRole.USER],
    },
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
  ])
  async deleteTag(@Args('id', { type: () => Int }) id: number) {
    await this.tagService.delete(id);

    return true;
  }
}
