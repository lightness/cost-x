import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentInDto, PaymentOutDto } from './dto';
import { Item, Payment } from '../database/entities';

@Injectable()
export class PaymentService {
  constructor(@InjectRepository(Payment) private paymentRepository: Repository<Payment>) {}

  async getPayment(item: Item, payment: Payment): Promise<Payment> {
    if (payment.itemId !== item.id) {
      throw new BadRequestException(`Payment #${payment.id} does not belong to item #${item.id}`);
    }

    return payment;
  } 

  async addPayment(item: Item, dto: PaymentInDto): Promise<PaymentOutDto> {
    return this.paymentRepository.save({ ...dto, itemId: item.id });
  }

  async updatePayment(item: Item, payment: Payment, dto: PaymentInDto): Promise<PaymentOutDto> {
    if (payment.itemId !== item.id) {
      throw new BadRequestException(`Payment #${payment.id} does not belong to item #${item.id}`);
    }

    payment.title = dto.title;
    payment.cost = dto.cost;
    payment.currency = dto.currency;
    payment.date = dto.date;

    return this.paymentRepository.save(payment);
  }

  async removePayment(item: Item, payment: Payment) {
    const paymentForItemCount = await this.paymentRepository.countBy({ id: payment.id, itemId: item.id });

    if (paymentForItemCount === 0) {
      throw new BadRequestException(`Payment #${payment.id} does not belong to item #${item.id}`);
    }

    await this.paymentRepository.remove(payment);
  }
}
