import { GqlExecutionContext } from '@nestjs/graphql';
import { Rule } from '../interfaces';

export const ACCESS_STRATEGIES = Symbol('ACCESS_STRATEGIES');

export interface AccessStrategy {
  isApplicable(rule: Rule): boolean;
  executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean>;
}
