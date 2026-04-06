import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../../generated/prisma/client';
import Payment from '../../src/payment/entity/payment.entity';
import { PrismaService } from '../../src/prisma/prisma.service';

@Injectable()
export class PaymentFactoryService {
  constructor(private prisma: PrismaService) {}

  async create(
    itemId: number,
    overrides: Partial<{ title: string; cost: Decimal; currency: Currency; date: Date }> = {},
  ): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        cost: overrides.cost ?? new Decimal('10.00'),
        currency: overrides.currency ?? Currency.USD,
        date: overrides.date ?? new Date('2024-01-01'),
        itemId,
        title: overrides.title,
      },
    });
  }
}
