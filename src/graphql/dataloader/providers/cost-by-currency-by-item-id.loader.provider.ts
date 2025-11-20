import { Provider } from '@nestjs/common';
import DataLoader from 'dataloader';
import { Payment } from '../../../database/entities';
import { Currency } from '../../../database/entities/currency.enum';
import { CostByCurrency } from '../../args/find-items-response.type';
import { Loader } from '../interfaces';

const DEFAULT_COST_BY_CURRENCY: CostByCurrency = {
  [Currency.BYN]: 0,
  [Currency.USD]: 0,
  [Currency.EUR]: 0,
};

export const costByCurrencyByItemIdLoaderProvider: Provider = {
  provide: Loader.COST_BY_CURRENCY_BY_ITEM_ID,
  useFactory(paymentsByItemIdLoader: DataLoader<number, Payment[]>) {
    return new DataLoader<number, CostByCurrency>(async (itemIds: number[]) => {
      const paymentsWithErrors = await paymentsByItemIdLoader.loadMany(itemIds);

      return paymentsWithErrors.map((paymentsOrError) => {
        if (!Array.isArray(paymentsOrError)) {
          return { ...DEFAULT_COST_BY_CURRENCY };
        }

        return paymentsOrError.reduce(
          (acc, payment) => {
            return {
              ...acc,
              [payment.currency]: acc[payment.currency] + payment.cost,
            }
          },
          { ...DEFAULT_COST_BY_CURRENCY },
        );
      });
    });
  },
  inject: [Loader.PAYMENTS_BY_ITEM_ID],
}
