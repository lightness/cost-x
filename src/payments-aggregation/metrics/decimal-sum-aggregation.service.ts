import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { MetricAggregationService } from './metric-aggregation.service';

@Injectable()
export class DecimalSumAggregationService extends MetricAggregationService<Decimal> {
  protected get reducerFn() {
    return (acc: Decimal, cur: Decimal) => Decimal.add(acc, cur);
  }

  protected get defaultValue() {
    return new Decimal(0);
  }
}