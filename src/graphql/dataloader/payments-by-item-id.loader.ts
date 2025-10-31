import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { Payment } from '../../database/entities';

@Injectable()
export class PaymentsByItemIdLoader {
  constructor(@InjectRepository(Payment) private paymentRepository: Repository<Payment>) {}

  public createLoader() {
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