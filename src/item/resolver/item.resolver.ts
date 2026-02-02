import { UseGuards } from '@nestjs/common';
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
import { TagsByItemIdLoader } from '../../item-tag/dataloader/tags-by-item-id.loader.service';
import { PaymentsByItemIdLoader } from '../../payment/dataloader/payments-by-item-id.loader.service';
import { PaymentsFilter } from '../../payment/dto';
import Payment from '../../payment/entity/payment.entity';
import { PaymentService } from '../../payment/payment.service';
import { PaymentsAggregation } from '../../payments-aggregation/entity/payments-aggregation.entity';
import { PrismaService } from '../../prisma/prisma.service';
import Tag from '../../tag/entity/tag.entity';
import { UserRole } from '../../user/entity/user-role.enum';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { ItemInDto, ItemsFilter } from '../dto';
import Item from '../entity/item.entity';
import { ItemService } from '../item.service';

@Resolver(() => Item)
@UseGuards(AuthGuard, AccessGuard)
export class ItemResolver {
  constructor(
    private prisma: PrismaService,
    private itemService: ItemService,
    private paymentService: PaymentService,
    private paymentsByItemIdLoader: PaymentsByItemIdLoader,
    private tagsByItemIdLoader: TagsByItemIdLoader,
  ) {}

  @ResolveField(() => [Payment])
  async payments(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Payment[]> {
    const allPayments = await this.paymentsByItemIdLoader
      .withOptions(paymentsFilter)
      .load(item.id);
    const payments = this.paymentService.filterPayments(
      allPayments,
      paymentsFilter,
    );

    return payments;
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() item: Item) {
    return this.tagsByItemIdLoader.load(item.id);
  }

  @ResolveField(() => PaymentsAggregation)
  async paymentsAggregation(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return {
      itemIds: [item.id],
      paymentsFilter,
    };
  }

  @ResolveField(() => Workspace)
  async workspace(@Parent() item: Item) {
    return this.prisma.workspace.findUnique({
      where: { id: item.workspaceId },
    });
  }

  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.ITEM,
    },
  ])
  @Query(() => Item)
  async item(@Args('id', { type: () => Int }) id: number) {
    return this.itemService.getById(id);
  }

  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('workspaceId'),
      targetScope: AccessScope.WORKSPACE,
    },
  ])
  @Query(() => [Item])
  async items(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    const items = await this.itemService.list(
      [workspaceId],
      itemsFilter,
      paymentsFilter,
    );

    return items;
  }

  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('workspaceId'),
      targetScope: AccessScope.WORKSPACE,
    },
  ])
  @Mutation(() => Item)
  async createItem(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { type: () => ItemInDto }) dto: ItemInDto,
  ) {
    return this.itemService.create(workspaceId, dto);
  }

  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.ITEM,
    },
  ])
  @Mutation(() => Item)
  async updateItem(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => ItemInDto }) dto: ItemInDto,
  ) {
    return this.itemService.update(id, dto);
  }

  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.ITEM,
    },
  ])
  @Mutation(() => Boolean)
  async deleteItem(@Args('id', { type: () => Int }) id: number) {
    await this.itemService.delete(id);

    return true;
  }
}
