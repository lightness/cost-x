
import { Query, Resolver } from '@nestjs/graphql';
import { Currency } from '../../currency-rate/entities/currency.enum';
import { DefaultCurrencyCostService } from '../../item-cost/default-currency-cost.service';

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