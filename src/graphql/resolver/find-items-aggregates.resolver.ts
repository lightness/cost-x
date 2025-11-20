import { Context, Float, Int, ResolveField, Resolver } from '@nestjs/graphql';
import { Item } from '../../database/entities';
import { CostByCurrency, FindItemsAggregates } from '../args/find-items-response.type';
import { IDataloaders } from '../dataloader/interfaces';
import { Currency } from '../../database/entities/currency.enum';
import { isNotError } from '../is-not-error';

@Resolver(() => FindItemsAggregates)
export class FindItemsAggregatesResolver {

  @ResolveField(() => Int)
  async count(
    @Context() { data: items }: { data: Item[] },
  ) {
    return items.length;
  }

  @ResolveField(() => Float)
  async costInDefaultCurrency(
    @Context() { data: items, loaders }: { data: Item[], loaders: IDataloaders },
  ): Promise<number> {
    const itemIds = items.map(({ id }) => id);
    const costsInDefaultCurrency = await loaders.costInDefaultCurrencyByItemIdLoader.loadMany(itemIds);

    return costsInDefaultCurrency
      .filter(isNotError)
      .reduce((acc, cur) => acc + cur, 0);
  }

  @ResolveField(() => CostByCurrency)
  async costByCurrency(
    @Context() { data: items, loaders }: { data: Item[], loaders: IDataloaders },
  ) {
    const itemIds = items.map(({ id }) => id);
    const costsByCurrency = await loaders.costByCurrencyByItemIdLoader.loadMany(itemIds);

    return costsByCurrency
      .filter(isNotError)
      .reduce((acc, cur) => {
        return {
          [Currency.BYN]: acc[Currency.BYN] + cur[Currency.BYN],
          [Currency.USD]: acc[Currency.USD] + cur[Currency.USD],
          [Currency.EUR]: acc[Currency.EUR] + cur[Currency.EUR],
        };
      })
  }

}