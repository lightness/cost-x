import { Context, Float, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { isNotError } from '../common/functions/is-not-error';
import { CurrencyRateLoader } from '../currency-rate/dataloaders/currency-rate.loader.service';
import { CurrencyRate } from '../database/entities';
import { CostByCurrencyService } from '../item-cost/cost-by-currency.service';
import { DefaultCurrencyCostService } from '../item-cost/default-currency-cost.service';
import { CostByCurrency } from '../item-cost/dto';
import { PaymentsByItemIdLoader } from '../payment/dataloaders/payments-by-item-id.loader.service';
import { PaymentsFilter } from '../payment/dto';
import { PaymentService } from '../payment/payment.service';
import { FindItemsAggregates } from './dto';

@Resolver(() => FindItemsAggregates)
export class FindItemsAggregatesResolver {
  constructor(
    private paymentService: PaymentService,
    private defaultCurrencyCostService: DefaultCurrencyCostService,
    private costByCurrencyService: CostByCurrencyService,
    private currencyRateLoader: CurrencyRateLoader,
    private paymentsByItemIdLoader: PaymentsByItemIdLoader,
  ) { }

  @ResolveField(() => Int)
  async count(
    @Parent() { items }: FindItemsAggregates,
  ) {
    return items.length;
  }

  @ResolveField(() => Float)
  async costInDefaultCurrency(
    @Parent() { items }: FindItemsAggregates,
    @Context('paymentsFilter') paymentsFilter: PaymentsFilter,
  ): Promise<number> {
    const itemIds = items.map(({ id }) => id);
    const allPayments = (await this.paymentsByItemIdLoader.loadMany(itemIds))
      .filter(isNotError)
      .flat();

    const payments = this.paymentService.filterPayments(allPayments, paymentsFilter);
    const requiredCurrencyRates = this.defaultCurrencyCostService.getRequiredCurrencyRates(payments);
    const currencyRates = (await this.currencyRateLoader.loadMany(requiredCurrencyRates))
      .reduce(
        (acc, cur) => {
          if (isNotError(cur)) {
            acc.push(cur);
          }

          return acc;
        },
        [] satisfies CurrencyRate[],
      );

    const cost = this.defaultCurrencyCostService.getCostInDefaultCurrency(payments, currencyRates);

    return cost;
  }

  @ResolveField(() => CostByCurrency)
  async costByCurrency(
    @Parent() { items }: FindItemsAggregates,
    @Context('paymentsFilter') paymentsFilter: PaymentsFilter,
  ) {
    const itemIds = items.map(({ id }) => id);
    const allPayments = (await this.paymentsByItemIdLoader.loadMany(itemIds))
      .filter(isNotError)
      .flat();
    const payments = this.paymentService.filterPayments(allPayments, paymentsFilter);
    const costsByCurrency = await this.costByCurrencyService.getCostByCurrency(payments);

    return costsByCurrency;
  }

}