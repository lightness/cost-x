import { Injectable } from '@nestjs/common';
import { Item, Payment } from '../database/entities';
import { Relation } from './relation';

@Injectable()
export class ConsistencyService {
  paymentToItem = new Relation<Payment, Item>(
    (payment) => payment.itemId,
    (item) => item.id,
    (payment, item) => `Payment #${payment.id} does not belong to item #${item.id}`,
  );
}
