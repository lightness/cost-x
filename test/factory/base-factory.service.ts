export abstract class BaseFactoryService<E, O, I> {
  abstract create(overrides: Partial<O>): Promise<E>;
  abstract generate(overrides: Partial<O>): Promise<I>;
}

export abstract class KindBasedFactoryService<K, E, O, I> {
  abstract create(kind?: K, overrides?: Partial<O>): Promise<E>;
  abstract generate(kind?: K, overrides?: Partial<O>): Promise<I>;
}
