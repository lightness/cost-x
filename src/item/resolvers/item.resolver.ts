import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { TagsByItemIdLoader } from '../../item-tag/dataloaders/tags-by-item-id.loader.service';
import { PaymentsByItemIdLoader } from '../../payment/dataloaders/payments-by-item-id.loader.service';
import { PaymentsFilter } from '../../payment/dto';
import Payment from '../../payment/entities/payment.entity';
import { PaymentService } from '../../payment/payment.service';
import { PaymentsAggregation } from '../../payments-aggregation/entities/payments-aggregation.entity';
import Tag from '../../tag/entities/tag.entity';
import { ItemInDto, ItemsFilter } from '../dto';
import Item from '../entities/item.entity';
import { ItemService } from '../item.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { AccessGuard } from '../../access/guard/access.guard';
import { Access } from '../../access/decorator/access.decorator';
import { AccessScope } from '../../access/interfaces';
import { UserRole } from '../../user/entities/user-role.enum';
import { fromArg } from '../../access/function/from-arg.function';

@Resolver(() => Item)
@UseGuards(AuthGuard, AccessGuard)
export class ItemResolver {
  constructor(
    private itemService: ItemService,
    private paymentService: PaymentService,
    private paymentsByItemIdLoader: PaymentsByItemIdLoader,
    private tagsByItemIdLoader: TagsByItemIdLoader,
  ) {}

  @Query(() => Item)
  async item(@Args('id', { type: () => Int }) id: number) {
    return this.itemService.getById(id);
  }

  @Query(() => [Item])
  async items(
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Item[]> {
    const items = await this.itemService.list(itemsFilter, paymentsFilter);

    return items;
  }

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

  @Access.allow([
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
    {
      targetScope: AccessScope.WORKSPACE,
      targetId: fromArg('workspaceId'),
      role: [UserRole.USER],
    },
  ])
  @Mutation(() => Item)
  async createItem(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { type: () => ItemInDto }) dto: ItemInDto,
  ) {
    return this.itemService.create(workspaceId, dto);
  }

  updateItem(

  ) {
    return this.itemService.
  }
}
