
import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { DefaultCurrencyCostService } from '../../item-cost/default-currency-cost.service';

@Resolver()
export class ConstantsResolver {
  constructor(
    private defaultCurrencyCostService: DefaultCurrencyCostService
  ) { }

  @Query(() => String)
  async defaultCurrency() {
    return this.defaultCurrencyCostService.defaultCurrency;
  }
}