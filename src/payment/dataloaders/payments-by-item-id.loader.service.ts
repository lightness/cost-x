import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Payment } from '../../database/entities';
import { BaseLoader } from '../../graphql/dataloaders/base.loader';

@Injectable({ scope: Scope.REQUEST })
export class PaymentsByItemIdLoader extends BaseLoader<number, Payment[]> {
  constructor(@InjectRepository(Payment) private paymentRepository: Repository<Payment>) {
    super();
  }

  protected async loaderFn(itemIds: number[]): Promise<Payment[][]> {
    const payments = await this.paymentRepository.find({
      where: { itemId: In(itemIds) },
    });

    const paymentsByItemId = itemIds.map(itemId =>
      payments.filter(payment => payment.itemId === itemId)
    );

    return paymentsByItemId;
  }
}