import { Args, Float, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsCountByItemIdLoader } from '../dataloaders/payments-count-by-item-id.loader.service';
import { PaymentsAggregation } from '../entities/payments-aggregation.entity';
import { PaymentsAggregationService } from '../payments-aggregation.service';
import { CostInDefaultCurrencyByItemIdLoader } from '../dataloaders/cost-in-default-currency-by-item-id.loader.service';

@Resolver(PaymentsAggregation)
export class PaymentsAggregationResolver {
  constructor(
    private paymentCountByItemIdLoader: PaymentsCountByItemIdLoader,
    private costInDefaultCurrencyByItemIdLoader: CostInDefaultCurrencyByItemIdLoader,
    private paymentAggregateService: PaymentsAggregationService,
  ) { }

  @Query(() => PaymentsAggregation)
  paymentsAggregation(@Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter) {
    return { paymentsFilter };
  }

  @ResolveField(() => Int)
  async count(
    @Parent() paymentsAggregation: PaymentsAggregation,
  ) {
    const { itemId, paymentsFilter } = paymentsAggregation;

    if (itemId) {
      return this.paymentCountByItemIdLoader
        .setOptions(paymentsFilter)
        .load(itemId);
    }

    return this.paymentAggregateService.getPaymentsCount(paymentsFilter);
  }

  @ResolveField(() => Float)
  async costInDefaultCurrency(@Parent() paymentsAggregation: PaymentsAggregation) {
    const { itemId, paymentsFilter } = paymentsAggregation;

    if (itemId) {
      return this.costInDefaultCurrencyByItemIdLoader
        .setOptions(paymentsFilter)
        .load(itemId);
    }

    return this.paymentAggregateService.getCostInDefaultCurrency(paymentsFilter);
  }
}