export abstract class BaseFactoryService<T, I> {
  abstract create(overrides: Partial<I>): Promise<T>;
  abstract generate(): I;
}
