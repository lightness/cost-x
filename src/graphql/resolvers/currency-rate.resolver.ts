import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Currency } from '../../database/entities/currency.enum';
import { CurrencyRateEntity } from '../entities/currency-rate.entity';
import { DateScalar } from '../scalars';
import { IDataloaders, LoaderName } from '../dataloaders/interfaces';

@Resolver(() => CurrencyRateEntity)
export class CurrencyRateResolver {
  @Query(() => CurrencyRateEntity)
  async currencyRate(
    @Args('date', { type: () => DateScalar }) date,
    @Args('fromCurrency', { type: () => Currency }) fromCurrency: Currency,
    @Args('toCurrency', { type: () => Currency }) toCurrency: Currency,
    @Context('loaders') loaders: IDataloaders,
  ): Promise<CurrencyRateEntity> {
    const rate = await loaders[LoaderName.CURRENCY_RATE].load({ fromCurrency, toCurrency, date });

    return { fromCurrency, toCurrency, date, rate };
  }
}