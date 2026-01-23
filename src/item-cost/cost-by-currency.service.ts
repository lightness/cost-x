import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../../generated/prisma/enums';
import { CostByCurrency } from './dto';
import { PaymentLike } from './interfaces';

@Injectable()
export class CostByCurrencyService {
  getCostByCurrency(payments: PaymentLike[]): CostByCurrency {
    return payments.reduce<CostByCurrency>(
      (acc, cur) => {
        acc[cur.currency] = Decimal.add(acc[cur.currency], cur.cost);

        return acc;
      },
      {
        [Currency.BYN]: new Decimal(0),
        [Currency.USD]: new Decimal(0),
        [Currency.EUR]: new Decimal(0),
      },
    );
  }
}
