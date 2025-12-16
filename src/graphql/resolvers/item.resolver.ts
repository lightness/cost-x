import { Args, Context, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ItemService } from '../../item/item.service';
import { IDataloaders } from '../dataloaders/interfaces';
import ItemEntity from '../entities/item.entity';
import TagEntity from '../entities/tag.entity';
import { PaymentService } from '../services/payment.service';
import { PaymentsFilter, FindPaymentsResponse, ItemsFilter, FindItemsResponse } from '../types';

@Resolver(() => ItemEntity)
export class ItemResolver {
  constructor(
    private itemService: ItemService,
    private paymentService: PaymentService,
  ) { }

  @Query(() => ItemEntity)
  async item(@Args('id', { type: () => Int }) id: number) {
    return this.itemService.getById(id);
  }

  @Query(() => FindItemsResponse)
  async items(
    @Args('itemsFilter', { nullable: true }) itemsFilter: ItemsFilter,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
    @Context() context,
  ): Promise<{}> {
    context.itemsFilter = itemsFilter;
    context.paymentsFilter = paymentsFilter;

    const items = await this.itemService.list({
      ...itemsFilter,
      paymentDateFrom: paymentsFilter.dateFrom,
      paymentDateTo: paymentsFilter.dateTo,
    });

    return { data: items };
  }

  @ResolveField(() => FindPaymentsResponse)
  async payments(
    @Parent() item: ItemEntity,
    @Context('paymentsFilter') paymentsFilter: PaymentsFilter,
    @Context('loaders') { paymentsByItemIdLoader }: IDataloaders,
  ) {
    const allPayments = await paymentsByItemIdLoader.load(item.id);
    const payments = this.paymentService.filterPayments(allPayments, paymentsFilter);

    return { data: payments };
  }

  @ResolveField(() => [TagEntity])
  async tags(
    @Parent() item: ItemEntity,
    @Context('loaders') { tagsByItemIdLoader }: IDataloaders,
  ) {
    return tagsByItemIdLoader.load(item.id);
  }
}
