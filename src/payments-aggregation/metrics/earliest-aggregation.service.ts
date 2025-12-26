import { Injectable } from '@nestjs/common';
import { MetricAggregationService } from './metric-aggregation.service';

@Injectable()
export class EarliestAggregationService extends MetricAggregationService<Date> {
  protected get reducerFn() {
    return (acc: Date, cur: Date) => {
      if (acc === null) {
        return cur;
      }

      return cur < acc ? cur : acc;
    }
  }

  protected get defaultValue() {
    return null;
  }
}