import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { cmp } from 'type-comparator';
import { Between, FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { ConsistencyService } from '../consistency/consistency.service';
import { Item, Payment } from '../database/entities';
import { PaymentLike } from '../item-cost/interfaces';
import { PaymentInDto, PaymentOutDto, PaymentsFilter } from './dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    private consistencyService: ConsistencyService,
  ) { }

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

  async list(filter: PaymentsFilter): Promise<Payment[]> {
    const { dateFrom, dateTo } = filter || {};

    const where: FindOptionsWhere<Payment> = {};

    if (dateFrom && dateTo) {
      where.date = Between(dateFrom, dateTo);
    } else if (dateFrom) {
      where.date = MoreThan(dateFrom);
    } else if (dateTo) {
      where.date = LessThan(dateTo);
    }

    const payments = await this.paymentRepository.find({ where });

    return payments;
  } 

  filterPayments<T extends PaymentLike>(payments: T[], filters: PaymentsFilter): T[] {
    const { dateFrom, dateTo } = filters || {};

    return payments.filter(({ date }) => {
      return (dateFrom ? dateFrom <= date : true) 
        && (dateTo ? dateTo > date : true);
    })
  }

  getFirstPaymentDate<T extends PaymentLike>(payments: T[]): Date {
    return payments.map(payment => payment.date).sort(cmp().asc()).at(0);
  }

  getLastPaymentDate<T extends PaymentLike>(payments: T[]): Date {
    return payments.map(payment => payment.date).sort(cmp().desc()).at(0);
  }
}
