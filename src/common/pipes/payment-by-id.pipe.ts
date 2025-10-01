import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../database/entities';

@Injectable()
export class PaymentByIdPipe implements PipeTransform<number, Promise<Payment>> {
  constructor(@InjectRepository(Payment) private paymentRepository: Repository<Payment>) { }

  async transform(value: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOneBy({ id: value });

    if (!payment) {
      throw new NotFoundException(`Payment #${value} not found`);
    }

    return payment;
  }
}