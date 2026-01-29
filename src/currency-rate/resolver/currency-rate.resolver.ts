import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrencyRateLoader } from '../dataloader/currency-rate.loader.service';
import { GetCurrencyRateInDto } from '../dto';
import CurrencyRate from '../entity/currency-rate.entity';

@Resolver(() => CurrencyRate)
export class CurrencyRateResolver {
  constructor(private currencyRateLoader: CurrencyRateLoader) {}

  @Query(() => CurrencyRate)
  async currencyRate(
    @Args({ type: () => GetCurrencyRateInDto }) args: GetCurrencyRateInDto,
  ): Promise<CurrencyRate> {
    const { fromCurrency, toCurrency, date } = args;

    const currencyRate = await this.currencyRateLoader.load({
      date,
      fromCurrency,
      toCurrency,
    });

    return currencyRate;
  }
}
