import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { IDataloaders, LoaderName } from '../graphql/dataloaders/interfaces';
import { GetCurrencyRateArgs } from './dto/get-currency-rate.args';
import CurrencyRate from './entities/currency-rate.entity';

@Resolver(() => CurrencyRate)
export class CurrencyRateResolver {
  @Query(() => CurrencyRate)
  async currencyRate(
    @Args({ type: () => GetCurrencyRateArgs }) args: GetCurrencyRateArgs,
    @Context('loaders') loaders: IDataloaders,
  ): Promise<CurrencyRate> {
    const { fromCurrency, toCurrency, date } = args;

    const currencyRate = await loaders[LoaderName.CURRENCY_RATE].load({
      fromCurrency,
      toCurrency,
      date,
    });

    return currencyRate;
  }
}