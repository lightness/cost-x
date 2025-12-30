import { Float, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { isNotError } from '../common/functions/is-not-error';
import { CurrencyRateLoader } from '../currency-rate/dataloaders/currency-rate.loader.service';
import CurrencyRate from '../currency-rate/entities/currency-rate.entity';
import { DateScalar } from '../graphql/scalars';
import { CostByCurrencyService } from '../item-cost/cost-by-currency.service';
import { DefaultCurrencyCostService } from '../item-cost/default-currency-cost.service';
import { CostByCurrency } from '../item-cost/dto';
import { FindPaymentsAggregates } from './dto';
import { PaymentService } from './payment.service';
import { Decimal } from '@prisma/client/runtime/client';

@Resolver(() => FindPaymentsAggregates)
export class FindPaymentsAggregatesResolver {
  constructor (
    private defaultCurrencyCostService: DefaultCurrencyCostService,
    private costByCurrencyService: CostByCurrencyService,
    private paymentService: PaymentService,
    private currencyRateLoader: CurrencyRateLoader,
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

  @ResolveField(() => Decimal)
  async costInDefaultCurrency(
    @Parent() { payments }: FindPaymentsAggregates,
  ) {
    const requiredCurrencyRates = this.defaultCurrencyCostService.getRequiredCurrencyRates(payments);

    const currencyRates = (await this.currencyRateLoader.loadMany(requiredCurrencyRates))
      .reduce(
        (acc, cur) => {
          if (isNotError(cur)) {
            acc.push(cur);
          }

          return acc;
        },
        [] as CurrencyRate[]
      );

    const cost = this.defaultCurrencyCostService.getCostInDefaultCurrency(payments, currencyRates);

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