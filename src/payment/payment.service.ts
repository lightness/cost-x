import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentInDto } from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentService {
  constructor(@InjectRepository(Payment) private paymentRepository: Repository<Payment>) {}

  async addPayment(itemId: number, dto: PaymentInDto) {
    return this.paymentRepository.save({ ...dto, itemId });
  }

  async updatePayment(itemId: number, paymentId: number, dto: PaymentInDto) {
    const payment = await this.paymentRepository.findOneBy({ id: paymentId, itemId });

    if (!payment) {
      throw new BadRequestException(`Payment #${paymentId} not found in item #${itemId}`);
    }

    payment.cost = dto.cost;
    payment.currency = dto.currency;
    payment.date = dto.date;

    return this.paymentRepository.save(payment);
  }

  async removePayment(itemId: number, paymentId: number) {
    const payment = await this.paymentRepository.findOneBy({ id: paymentId, itemId });

    if (!payment) {
      throw new BadRequestException(`Payment #${paymentId} not found in item #${itemId}`);
    }

    await this.paymentRepository.remove(payment);
  }
}
