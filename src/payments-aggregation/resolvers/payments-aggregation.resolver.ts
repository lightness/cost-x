import {
  Args,
  Float,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { isNotError } from '../../common/functions/is-not-error';
import { DateScalar } from '../../graphql/scalars';
import { CostByCurrency } from '../../item-cost/dto';
import { PaymentsFilter } from '../../payment/dto';
import { CostByCurrencyByItemIdLoader } from '../dataloaders/cost-by-currency-by-item-id.loader.service';
import { CostInDefaultCurrencyByItemIdLoader } from '../dataloaders/cost-in-default-currency-by-item-id.loader.service';
import { FirstPaymentDateByItemIdLoader } from '../dataloaders/first-payment-date-by-item-id.loader.service';
import { LastPaymentDateByItemIdLoader } from '../dataloaders/last-payment-date-by-item-id.loader.service';
import { PaymentsCountByItemIdLoader } from '../dataloaders/payments-count-by-item-id.loader.service';
import { PaymentsAggregation } from '../entities/payments-aggregation.entity';
import { CostByCurrencyAggregationService } from '../metrics/cost-by-currency-aggregation.service';
import { DecimalSumAggregationService } from '../metrics/decimal-sum-aggregation.service';
import { EarliestAggregationService } from '../metrics/earliest-aggregation.service';
import { LatestAggregationService } from '../metrics/latest-aggregation.service';
import { SumAggregationService } from '../metrics/sum-aggregation.service';
import { PaymentsAggregationService } from '../payments-aggregation.service';

@Resolver(PaymentsAggregation)
export class PaymentsAggregationResolver {
  constructor(
    private paymentAggregateService: PaymentsAggregationService,
    private paymentCountByItemIdLoader: PaymentsCountByItemIdLoader,
    private costInDefaultCurrencyByItemIdLoader: CostInDefaultCurrencyByItemIdLoader,
    private costByCurrencyByItemIdLoader: CostByCurrencyByItemIdLoader,
    private firstPaymentDateByItemIdLoader: FirstPaymentDateByItemIdLoader,
    private lastPaymentDateByItemIdLoader: LastPaymentDateByItemIdLoader,
    private sumAggregationService: SumAggregationService,
    private decimalSumAggregationService: DecimalSumAggregationService,
    private earliestAggregationService: EarliestAggregationService,
    private latestAggregationService: LatestAggregationService,
    private costByCurrencyAggregationService: CostByCurrencyAggregationService,
  ) {}

  @Query(() => PaymentsAggregation)
  paymentsAggregation(
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return { paymentsFilter };
  }

  @ResolveField(() => Int)
  async count(@Parent() paymentsAggregation: PaymentsAggregation) {
    const { itemIds, paymentsFilter } = paymentsAggregation;

    if (itemIds) {
      const countByItemId = await this.paymentCountByItemIdLoader
        .withOptions(paymentsFilter)
        .loadMany(itemIds);

      return countByItemId
        .filter(isNotError)
        .reduce(...this.sumAggregationService.reducer);
    }

    return this.paymentAggregateService.getPaymentsCount(paymentsFilter);
  }

  @ResolveField(() => Float)
  async costInDefaultCurrency(
    @Parent() paymentsAggregation: PaymentsAggregation,
  ) {
    const { itemIds, paymentsFilter } = paymentsAggregation;

    if (itemIds) {
      const costInDefaultCurrencyByItemId =
        await this.costInDefaultCurrencyByItemIdLoader
          .withOptions(paymentsFilter)
          .loadMany(itemIds);

      return costInDefaultCurrencyByItemId
        .filter(isNotError)
        .reduce(...this.decimalSumAggregationService.reducer);
    }

    return this.paymentAggregateService.getCostInDefaultCurrency(
      paymentsFilter,
    );
  }

  @ResolveField(() => CostByCurrency)
  async costByCurrency(@Parent() paymentsAggregation: PaymentsAggregation) {
    const { itemIds, paymentsFilter } = paymentsAggregation;

    if (itemIds) {
      const costByCurrencyByItemId = await this.costByCurrencyByItemIdLoader
        .withOptions(paymentsFilter)
        .loadMany(itemIds);

      return costByCurrencyByItemId
        .filter(isNotError)
        .reduce(...this.costByCurrencyAggregationService.reducer);
    }

    return this.paymentAggregateService.getCostByCurrency(paymentsFilter);
  }

  @ResolveField(() => DateScalar)
  async firstPaymentDate(@Parent() paymentsAggregation: PaymentsAggregation) {
    const { itemIds, paymentsFilter } = paymentsAggregation;

    if (itemIds) {
      const firstPaymentDateByItemId = await this.firstPaymentDateByItemIdLoader
        .withOptions(paymentsFilter)
        .loadMany(itemIds);

      return firstPaymentDateByItemId
        .filter(isNotError)
        .reduce(...this.earliestAggregationService.reducer);
    }

    return this.paymentAggregateService.getFirstPaymentDate(paymentsFilter);
  }

  @ResolveField(() => DateScalar)
  async lastPaymentDate(@Parent() paymentsAggregation: PaymentsAggregation) {
    const { itemIds, paymentsFilter } = paymentsAggregation;

    if (itemIds) {
      const lastPaymentDateByItemId = await this.lastPaymentDateByItemIdLoader
        .withOptions(paymentsFilter)
        .loadMany(itemIds);

      return lastPaymentDateByItemId
        .filter(isNotError)
        .reduce(...this.latestAggregationService.reducer);
    }

    return this.paymentAggregateService.getLastPaymentDate(paymentsFilter);
  }
}
