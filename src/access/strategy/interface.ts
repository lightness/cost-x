import { ResolvedRule } from '../interfaces';

export const ACCESS_STRATEGIES = Symbol('ACCESS_STRATEGIES');

export interface AccessStrategy {
  isApplicable(rule: ResolvedRule): boolean;
  executeRule(rule: ResolvedRule): Promise<boolean>;
}
