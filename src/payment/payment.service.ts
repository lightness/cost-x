import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentInDto, PaymentOutDto } from './dto';
import { Item, Payment } from '../database/entities';
import { ConsistencyService } from '../consistency/consistency.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    private consistencyService: ConsistencyService,
  ) {}

  async getPayment(item: Item, payment: Payment): Promise<Payment> {
    this.consistencyService.paymentToItem.ensureIsBelonging(payment, item);

    if (payment.itemId !== item.id) {
      throw new BadRequestException(`Payment #${payment.id} does not belong to item #${item.id}`);
    }

    return payment;
  } 

  async addPayment(item: Item, dto: PaymentInDto): Promise<PaymentOutDto> {
    return this.paymentRepository.save({ ...dto, itemId: item.id });
  }

  async updatePayment(item: Item, payment: Payment, dto: PaymentInDto): Promise<PaymentOutDto> {
    this.consistencyService.paymentToItem.ensureIsBelonging(payment, item);

    payment.title = dto.title;
    payment.cost = dto.cost;
    payment.currency = dto.currency;
    payment.date = new Date(dto.date);

    return this.paymentRepository.save(payment);
  }

  async removePayment(item: Item, payment: Payment) {
    this.consistencyService.paymentToItem.ensureIsBelonging(payment, item);

    await this.paymentRepository.remove(payment);
  }
}
