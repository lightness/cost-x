import { Provider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { Payment } from '../../../database/entities';
import { Loader } from '../interfaces';

export const paymentsByItemIdLoaderProvider: Provider = {
  provide: Loader.PAYMENTS_BY_ITEM_ID,
  useFactory: (paymentRepository: Repository<Payment>) => {
    return new DataLoader<number, Payment[]>(async (itemIds: number[]) => {

      const payments = await paymentRepository.find({
        where: { itemId: In(itemIds) },
      });

      const paymentsByItemId = itemIds.map(itemId =>
        payments.filter(payment => payment.itemId === itemId)
      );

      return paymentsByItemId;
    });
  },
  inject: [getRepositoryToken(Payment)],
}