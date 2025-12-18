import { Args, Float, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { DateScalar } from '../../graphql/scalars';
import { PaymentsFilter } from '../../payment/dto';
import { CostByCurrencyByItemIdLoader } from '../dataloaders/cost-by-currency-by-item-id.loader.service';
import { CostInDefaultCurrencyByItemIdLoader } from '../dataloaders/cost-in-default-currency-by-item-id.loader.service';
import { FirstPaymentDateByItemIdLoader } from '../dataloaders/first-payment-date-by-item-id.loader.service';
import { LastPaymentDateByItemIdLoader } from '../dataloaders/last-payment-date-by-item-id.loader.service';
import { PaymentsCountByItemIdLoader } from '../dataloaders/payments-count-by-item-id.loader.service';
import { PaymentsAggregation } from '../entities/payments-aggregation.entity';
import { PaymentsAggregationService } from '../payments-aggregation.service';
import { CostByCurrency } from '../../item-cost/dto';

@Resolver(PaymentsAggregation)
export class PaymentsAggregationResolver {
  constructor(
    private paymentCountByItemIdLoader: PaymentsCountByItemIdLoader,
    private costInDefaultCurrencyByItemIdLoader: CostInDefaultCurrencyByItemIdLoader,
    private costByCurrencyByItemIdLoader: CostByCurrencyByItemIdLoader,
    private firstPaymentDateByItemIdLoader: FirstPaymentDateByItemIdLoader,
    private lastPaymentDateByItemIdLoader: LastPaymentDateByItemIdLoader,
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

  @ResolveField(() => CostByCurrency)
  async costByCurrency(@Parent() paymentsAggregation: PaymentsAggregation) {
    const { itemId, paymentsFilter } = paymentsAggregation;

    if (itemId) {
      return this.costByCurrencyByItemIdLoader
        .setOptions(paymentsFilter)
        .load(itemId);
    }

    return this.paymentAggregateService.getCostByCurrency(paymentsFilter);
  }

  @ResolveField(() => DateScalar)
  async firstPaymentDate(@Parent() paymentsAggregation: PaymentsAggregation) {
    const { itemId, paymentsFilter } = paymentsAggregation;

    if (itemId) {
      return this.firstPaymentDateByItemIdLoader
        .setOptions(paymentsFilter)
        .load(itemId);
    }

    return this.paymentAggregateService.getFirstPaymentDate(paymentsFilter);
  }

  @ResolveField(() => DateScalar)
  async lastPaymentDate(@Parent() paymentsAggregation: PaymentsAggregation) {
    const { itemId, paymentsFilter } = paymentsAggregation;

    if (itemId) {
      return this.lastPaymentDateByItemIdLoader
        .setOptions(paymentsFilter)
        .load(itemId);
    }

    return this.paymentAggregateService.getLastPaymentDate(paymentsFilter);
  }
}