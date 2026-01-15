import { Inject, Injectable } from '@nestjs/common';
import type { GqlExecutionContext } from '@nestjs/graphql';
import type { Rule } from './interfaces';
import { ACCESS_STRATEGIES, type AccessStrategy } from './strategy/interface';

@Injectable()
export class RuleEngineService {
  constructor(
    @Inject(ACCESS_STRATEGIES) private strategies: AccessStrategy[],
  ) {}

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const strategy = this.strategies.find((strategy) =>
      strategy.isApplicable(rule),
    );

    return strategy.executeRule(rule, ctx);
  }
}
