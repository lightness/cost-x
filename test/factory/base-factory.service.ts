export abstract class BaseFactoryService<T> {
  constructor() {}

  abstract get repo();

  abstract create(inDto: Partial<T>): Promise<T>;
}
