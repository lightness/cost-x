export abstract class BaseFactoryService<T, I> {
  abstract create(overrides: I): Promise<T>;
  abstract generate(): I;
}
