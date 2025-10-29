import { BadRequestException } from '@nestjs/common';

export class Relation<T1, T2> {
  constructor(
    private t1Getter: (t1: T1) => unknown,
    private t2Getter: (t2: T2) => unknown,
    private messageFactory: (t1: T1, t2: T2) => string
  ) {}

  isBelonging(t1: T1, t2: T2): boolean {
    return this.t1Getter(t1) === this.t2Getter(t2);
  }

  ensureIsBelonging(t1: T1, t2: T2): void {
    if (!this.isBelonging(t1, t2)) {
      throw new BadRequestException(this.messageFactory(t1, t2))
    }
  }
}