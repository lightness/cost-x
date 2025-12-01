import { Context, Float, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CostByCurrencyService } from '../../item-cost/cost-by-currency.service';
import { DefaultCurrencyCostService } from '../../item-cost/default-currency-cost.service';
import { IDataloaders, LoaderName } from '../dataloaders/interfaces';
import { isNotError } from '../is-not-error';
import { PaymentService } from '../services/payment.service';
import { CostByCurrency, FindItemsAggregates, PaymentsFilter } from '../types';
import { CurrencyRateEntity } from '../entities/currency-rate.entity';

@Resolver(() => FindItemsAggregates)
export class FindItemsAggregatesResolver {
  constructor(
    private paymentService: PaymentService,
    private defaultCurrencyCostService: DefaultCurrencyCostService,
    private costByCurrencyService: CostByCurrencyService,
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
    @Context('loaders') loaders: IDataloaders,
    @Context('paymentsFilter') paymentsFilter: PaymentsFilter,
  ): Promise<number> {
    const itemIds = items.map(({ id }) => id);
    const allPayments = (await loaders[LoaderName.PAYMENTS_BY_ITEM_ID].loadMany(itemIds))
      .filter(isNotError)
      .flat();
    const payments = this.paymentService.filterPayments(allPayments, paymentsFilter);
    const requiredCurrencyRates = this.defaultCurrencyCostService.getRequiredCurrencyRates(payments);
    const currencyRates = (await loaders[LoaderName.CURRENCY_RATE].loadMany(requiredCurrencyRates))
      .reduce(
        (acc, cur, index) => {
          if (isNotError(cur)) {
            acc.push({ ...requiredCurrencyRates[index], rate: cur });
          }

          return acc;
        },
        [] satisfies CurrencyRateEntity[],
      );

    const cost = this.defaultCurrencyCostService.getCostInDefaultCurrency(payments, currencyRates);

    return cost;
  }

  @ResolveField(() => CostByCurrency)
  async costByCurrency(
    @Parent() { items }: FindItemsAggregates,
    @Context('loaders') loaders: IDataloaders,
    @Context('paymentsFilter') paymentsFilter: PaymentsFilter,
  ) {
    const itemIds = items.map(({ id }) => id);
    const allPayments = (await loaders.paymentsByItemIdLoader.loadMany(itemIds))
      .filter(isNotError)
      .flat();
    const payments = this.paymentService.filterPayments(allPayments, paymentsFilter);
    const costsByCurrency = await this.costByCurrencyService.getCostByCurrency(payments);

    return costsByCurrency;
  }

}