import { Provider } from '@nestjs/common';
import DataLoader from 'dataloader';
import { Payment } from '../../../database/entities';
import { DefaultCurrencyCostService } from '../../../item-cost/default-currency-cost.service';
import { Loader } from '../interfaces';

export const costInDefaultCurrencyByItemIdLoaderProvider: Provider = {
  provide: Loader.COST_IN_DEFAULT_CURRENCY_BY_ITEM_ID,
  useFactory(paymentsByItemIdLoader: DataLoader<number, Payment[]>, defaultCurrencyCostService: DefaultCurrencyCostService) {
    return new DataLoader<number, number>(async (itemIds: number[]) => {
      const paymentsWithErrors = await paymentsByItemIdLoader.loadMany(itemIds);

      const costInDefaultCurrencyByItemId = await Promise.all(
        paymentsWithErrors.map(async (paymentsOrError) => {
          if (!Array.isArray(paymentsOrError)) {
            return 0; // assume error
          }

          const { cost } = await defaultCurrencyCostService.getCostInDefaultCurrency(paymentsOrError);

          return cost;
        })
      );

      return costInDefaultCurrencyByItemId;
    });
  },
  inject: [Loader.PAYMENTS_BY_ITEM_ID, DefaultCurrencyCostService],
}
