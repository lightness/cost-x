
import { Query, Resolver } from '@nestjs/graphql';
import { DefaultCurrencyCostService } from '../../item-cost/default-currency-cost.service';
import { Currency } from '../../../generated/prisma/enums';

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