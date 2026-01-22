import {
  Args,
  Int,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessScope } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { ItemsByWorkspaceIdLoader } from '../../item/dataloaders/items-by-workspace-id.loader.service';
import { ItemsFilter } from '../../item/dto';
import Item from '../../item/entities/item.entity';
import { ItemsAggregationsByWorkspaceIdLoader } from '../../items-aggregation/dataloaders/items-aggregations-by-workspace-id.loader.service';
import { ItemsAggregation } from '../../items-aggregation/entities/items-aggregation.entity';
import { PaymentsFilter } from '../../payment/dto';
import { TagsByWorkspaceIdLoader } from '../../tag/dataloader/tags-by-workspace-id.loader.service';
import { TagsFilter } from '../../tag/dto';
import Tag from '../../tag/entities/tag.entity';
import { UserRole } from '../../user/entities/user-role.enum';
import { User } from '../../user/entities/user.entity';
import { WorkspaceInDto } from '../dto';
import { Workspace } from '../entity/workspace.entity';
import { WorkspaceService } from '../workspace.service';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(
    private workspaceService: WorkspaceService,
    private itemsByWorkspaceLoader: ItemsByWorkspaceIdLoader,
    private tagsByWorkspaceIdLoader: TagsByWorkspaceIdLoader,
    private itemsAggregationsByWorkspaceIdLoader: ItemsAggregationsByWorkspaceIdLoader,
  ) {}

  @ResolveField(() => [Item])
  async items(
    @Parent() workspace: Workspace,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    const items = await this.itemsByWorkspaceLoader
      .withOptions({ itemsFilter, paymentsFilter })
      .load(workspace.id);

    return items;
  }

  @ResolveField(() => [Tag])
  async tags(
    @Parent() workspace: Workspace,
    @Args('tagsFilter', { nullable: true }) tagsFilter: TagsFilter,
  ) {
    const tags = await this.tagsByWorkspaceIdLoader
      .withOptions(tagsFilter)
      .load(workspace.id);

    return tags;
  }

  @ResolveField(() => ItemsAggregation)
  async itemsAggregation(
    @Parent() workspace: Workspace,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    const itemsAggregation = this.itemsAggregationsByWorkspaceIdLoader
      .withOptions({ itemsFilter, paymentsFilter })
      .load(workspace.id);

    return itemsAggregation;
  }


  @Mutation(() => Workspace)
  @Access.allow([
    { targetScope: AccessScope.GLOBAL, role: [UserRole.USER, UserRole.ADMIN] },
  ])
  async createWorkspace(
    @Args('dto') dto: WorkspaceInDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.workspaceService.create(dto, currentUser);
  }

  @Mutation(() => Workspace)
  @Access.allow([
    {
      targetScope: AccessScope.WORKSPACE,
      targetId: fromArg('id'),
      role: [UserRole.USER],
    },
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
  ])
  async updateWorkspace(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto') dto: WorkspaceInDto,
  ) {
    return this.workspaceService.update(id, dto);
  }

  @Mutation(() => Workspace)
  @Access.allow([
    {
      targetScope: AccessScope.WORKSPACE,
      targetId: fromArg('id'),
      role: [UserRole.USER],
    },
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
  ])
  async deleteWorkspace(@Args('id', { type: () => Int }) id: number) {
    return this.workspaceService.delete(id);
  }
}
