import { BaseLoader } from './base.loader';

export abstract class CustomizableLoader<K, V, C, O> extends BaseLoader<K, V, C> {
  protected options: O = {} as O;

  constructor() {
    super();
  }

  protected loaderFn(requests: K[]): Promise<V[]> {
    const { options } = this;
    this.clearOptions();

    return this.loaderWithOptionsFn(requests, options);
  }

  protected abstract loaderWithOptionsFn(requests: K[], options: O): Promise<V[]>;

  protected cacheFn(key: K): C {
    return `${key}(${this.serializeOptions(this.options)})` as unknown as C;
  }

  protected serializeOptions(options: O): C {
    return JSON.stringify(options) as unknown as C;
  }

  public setOptions(options: O): this {
    this.options = { ...options };

    return this;
  }

  private clearOptions() {
    this.setOptions({} as O);
  }
}