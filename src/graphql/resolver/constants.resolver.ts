
import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { DefaultCurrencyCostService } from '../../item-cost/default-currency-cost.service';
import { Currency } from '../../database/entities/currency.enum';

@Resolver()
export class ConstantsResolver {
  constructor(
    private defaultCurrencyCostService: DefaultCurrencyCostService
  ) { }

  @Query(() => Currency)
  async defaultCurrency() {
    return this.defaultCurrencyCostService.defaultCurrency;
  }
}