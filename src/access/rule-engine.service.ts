import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ResolvedRule } from './interfaces';
import { ACCESS_STRATEGIES, AccessStrategy } from './strategy/interface';

@Injectable()
export class RuleEngineService {
  constructor(@Inject(ACCESS_STRATEGIES) private strategies: AccessStrategy[]) {}

  async executeRule(rule: ResolvedRule, ctx: GqlExecutionContext): Promise<boolean> {
    const strategy = this.strategies.find((strategy) => strategy.isApplicable(rule));

    if (!strategy) {
      throw new InternalServerErrorException(`Strategy not defined`);
    }

    return strategy.executeRule(rule, ctx);
  }
}
