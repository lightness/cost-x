export abstract class MetricAggregationService<T> {
  protected abstract get reducerFn(): (acc: T, cur: T) => T;
  protected abstract get defaultValue(): T;

  get reducer(): [(acc: T, cur: T) => T, T] {
    return [this.reducerFn, this.defaultValue];
  }
}