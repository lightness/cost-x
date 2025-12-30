import { Injectable } from '@nestjs/common';
import { Relation } from './relation';
import Payment from '../payment/entities/payment.entity';
import Item from '../item/entities/item.entity';

@Injectable()
export class ConsistencyService {
  paymentToItem = new Relation<Payment, Item>(
    (payment) => payment.itemId,
    (item) => item.id,
    (payment, item) => `Payment #${payment.id} does not belong to item #${item.id}`,
  );
}
