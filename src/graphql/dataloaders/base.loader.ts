import DataLoader from 'dataloader';

export abstract class BaseLoader<K, V, C = K> extends DataLoader<K, V, C> {
  constructor() {
    super(
      (requests: K[]) => this.loaderFn(requests), 
      { cacheKeyFn: (request: K) => this.cacheFn(request) },
    );
  }

  protected abstract loaderFn(requests: K[]): Promise<V[]>;

  protected cacheFn(request: K): C {
    return request as unknown as C;
  }
}