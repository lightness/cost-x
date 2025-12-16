import { Injectable } from '@nestjs/common';
import { PaymentLike } from './interfaces';
import { CostByCurrencyOutDto } from './dto/cost-by-currency.out.dto';
import { Currency } from '../database/entities/currency.enum';

@Injectable()
export class CostByCurrencyService {
  async getCostByCurrency(payments: PaymentLike[]): Promise<CostByCurrencyOutDto> {
    return payments.reduce(
      (acc, cur) => {
        acc[cur.currency] += cur.cost;

        return acc;
      }, 
      {
        [Currency.BYN]: 0,
        [Currency.USD]: 0,
        [Currency.EUR]: 0,
      }
    )
  }
}