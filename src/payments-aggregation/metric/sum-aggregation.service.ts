import { Injectable } from '@nestjs/common';
import { MetricAggregationService } from './metric-aggregation.service';

@Injectable()
export class SumAggregationService extends MetricAggregationService<number> {
  protected get reducerFn() {
    return (acc: number, cur: number) => acc + cur;
  }

  protected get defaultValue() {
    return 0;
  }
}
