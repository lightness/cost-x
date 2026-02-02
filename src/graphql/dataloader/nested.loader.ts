import { BaseLoader } from './base.loader';

export abstract class NestedLoader<K, V, O, C = K> {
  private loadersMap = new Map<string, BaseLoader<K, V, C>>();

  load(key: K) {
    return this.withOptions({} as O).load(key);
  }

  withOptions(options: O) {
    const cacheKey = this.serializeOptions(options);
    let loader = this.loadersMap.get(cacheKey);

    if (!loader) {
      loader = this.createNewLoader(options);

      this.loadersMap.set(cacheKey, loader);
    }

    return loader;
  }

  protected serializeOptions(options: O): string {
    return JSON.stringify(options);
  }

  protected createNewLoader(options: O): BaseLoader<K, V, C> {
    const loaderFn = this.loaderWithOptionsFn.bind(this);

    return new (class extends BaseLoader<K, V, C> {
      protected loaderFn(requests: K[]): Promise<V[]> {
        return loaderFn(requests, options);
      }
    })();
  }

  protected abstract loaderWithOptionsFn(
    requests: K[],
    options: O,
  ): Promise<V[]>;
}
