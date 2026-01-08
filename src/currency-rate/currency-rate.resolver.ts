import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrencyRateLoader } from './dataloaders/currency-rate.loader.service';
import { GetCurrencyRateArgs } from './dto/get-currency-rate.args';
import CurrencyRate from './entities/currency-rate.entity';

@Resolver(() => CurrencyRate)
export class CurrencyRateResolver {
  constructor(private currencyRateLoader: CurrencyRateLoader) {}

  @Query(() => CurrencyRate)
  async currencyRate(
    @Args({ type: () => GetCurrencyRateArgs }) args: GetCurrencyRateArgs,
  ): Promise<CurrencyRate> {
    const { fromCurrency, toCurrency, date } = args;

    const currencyRate = await this.currencyRateLoader.load({
      fromCurrency,
      toCurrency,
      date,
    });

    return currencyRate;
  }
}