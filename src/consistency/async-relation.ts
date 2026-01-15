import { BadRequestException } from '@nestjs/common';

export class AsyncRelation<T1, T2> {
  constructor(
    private t1Getter: (t1: T1) => Promise<unknown>,
    private t2Getter: (t2: T2) => Promise<unknown>,
    private messageFactory: (t1: T1, t2: T2) => string,
  ) {}

  async isBelonging(t1: T1, t2: T2): Promise<boolean> {
    const [t1Id, t2Id] = await Promise.all([
      this.t1Getter(t1),
      this.t2Getter(t2),
    ]);

    return t1Id === t2Id;
  }

  async ensureIsBelonging(t1: T1, t2: T2): Promise<void> {
    const belongs = this.isBelonging(t1, t2);

    if (!belongs) {
      throw new BadRequestException(this.messageFactory(t1, t2));
    }
  }
}
