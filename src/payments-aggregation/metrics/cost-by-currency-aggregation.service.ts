import { Injectable } from '@nestjs/common';
import { Currency } from '../../currency-rate/entities/currency.enum';
import { CostByCurrency } from '../../item-cost/dto';
import { MetricAggregationService } from './metric-aggregation.service';

@Injectable()
export class CostByCurrencyAggregationService extends MetricAggregationService<CostByCurrency> {
  protected get reducerFn() {
    return (acc: CostByCurrency, cur: CostByCurrency) => ({
      [Currency.BYN]: acc[Currency.BYN] + cur[Currency.BYN],
      [Currency.EUR]: acc[Currency.EUR] + cur[Currency.EUR],
      [Currency.USD]: acc[Currency.USD] + cur[Currency.USD],
    })
  }

  protected get defaultValue(): CostByCurrency {
    return {
      [Currency.BYN]: 0,
      [Currency.EUR]: 0,
      [Currency.USD]: 0,
    }
  }
}