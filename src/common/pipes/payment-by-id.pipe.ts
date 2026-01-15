import {
  Injectable,
  NotFoundException,
  type PipeTransform,
} from '@nestjs/common';
import type Payment from '../../payment/entities/payment.entity';
import type { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentByIdPipe
  implements PipeTransform<number, Promise<Payment>>
{
  constructor(private prisma: PrismaService) {}

  async transform(value: number): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: value },
    });

    if (!payment) {
      throw new NotFoundException(`Payment #${value} not found`);
    }

    return payment;
  }
}
