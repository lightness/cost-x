import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { cmp } from 'type-comparator';
import { Between, FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { Payment } from '../../database/entities';
import { PaymentLike } from '../../item-cost/interfaces';
import PaymentEntity from '../entities/payment.entity';
import { PaymentsFilter } from '../types';

@Injectable()
export class PaymentService {
  constructor(@InjectRepository(Payment) private paymentRepository: Repository<Payment>) {}

  async list(filter: PaymentsFilter): Promise<PaymentEntity[]> {
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
    const { dateFrom, dateTo } = filters;

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