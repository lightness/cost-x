import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { Payment } from '../../../database/entities';
import { IDataloaderService, LoaderName } from '../interfaces';

@Injectable()
export class PaymentsByItemIdLoaderService implements IDataloaderService<number, Payment[]> {
  constructor(@InjectRepository(Payment) private paymentRepository: Repository<Payment>) {}

  get loaderName(): LoaderName {
    return LoaderName.PAYMENTS_BY_ITEM_ID;
  }

  createDataloader(): DataLoader<number, Payment[]> {
    return new DataLoader<number, Payment[]>(async (itemIds: number[]) => {

      const payments = await this.paymentRepository.find({
        where: { itemId: In(itemIds) },
      });

      const paymentsByItemId = itemIds.map(itemId =>
        payments.filter(payment => payment.itemId === itemId)
      );

      return paymentsByItemId;
    });
  }
}