import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { CostByCurrency } from '../../item-cost/dto';
import { MetricAggregationService } from './metric-aggregation.service';
import { Currency } from '../../currency-rate/entities/currency.enum';

@Injectable()
export class CostByCurrencyAggregationService extends MetricAggregationService<CostByCurrency> {
  protected get reducerFn() {
    return (acc: CostByCurrency, cur: CostByCurrency) => ({
      [Currency.BYN]: Decimal.add(acc[Currency.BYN], cur[Currency.BYN]),
      [Currency.EUR]: Decimal.add(acc[Currency.EUR], cur[Currency.EUR]),
      [Currency.USD]: Decimal.add(acc[Currency.USD], cur[Currency.USD]),
    })
  }

  protected get defaultValue(): CostByCurrency {
    return {
      [Currency.BYN]: new Decimal(0),
      [Currency.EUR]: new Decimal(0),
      [Currency.USD]: new Decimal(0),
    }
  }
}