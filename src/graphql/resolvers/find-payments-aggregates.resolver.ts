import { Float, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CostByCurrencyService } from '../../item-cost/cost-by-currency.service';
import { DefaultCurrencyCostService } from '../../item-cost/default-currency-cost.service';
import { DateScalar } from '../scalars';
import { PaymentService } from '../services/payment.service';
import { CostByCurrency, FindPaymentsAggregates } from '../types';

@Resolver(() => FindPaymentsAggregates)
export class FindPaymentsAggregatesResolver {
  constructor (
    private defaultCurrencyCostService: DefaultCurrencyCostService,
    private costByCurrencyService: CostByCurrencyService,
    private paymentService: PaymentService,
  ) {}

  @ResolveField(() => Int)
  async count(
    @Parent() { payments }: FindPaymentsAggregates,
  ) {
    return payments.length;
  }

  @ResolveField(() => CostByCurrency)
  async costByCurrency(
    @Parent() { payments }: FindPaymentsAggregates,
  ) {
    const costByCurrency = await this.costByCurrencyService.getCostByCurrency(payments);

    return costByCurrency;
  }

  @ResolveField(() => Float)
  async costInDefaultCurrency(
    @Parent() { payments }: FindPaymentsAggregates,
  ) {
    const { cost } = await this.defaultCurrencyCostService.getCostInDefaultCurrency(payments);

    return cost;
  }

  @ResolveField(() => DateScalar)
  async firstPaymentDate(
    @Parent() { payments }: FindPaymentsAggregates,
  ) {
    return this.paymentService.getFirstPaymentDate(payments);
  }

  @ResolveField(() => DateScalar)
  async lastPaymentDate(
    @Parent() { payments }: FindPaymentsAggregates,
  ) {
    return this.paymentService.getLastPaymentDate(payments);
  }
}