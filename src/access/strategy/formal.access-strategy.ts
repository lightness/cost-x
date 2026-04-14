import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ResolvedRule } from '../interfaces';
import { GlobalAccessStrategy } from './global.access-strategy';
import { AccessStrategy } from './interface';

@Injectable()
export class FormalAccessStrategy extends GlobalAccessStrategy implements AccessStrategy {
  isApplicable(rule: ResolvedRule): boolean {
    return rule.targetScope === rule.sourceScope;
  }

  async executeRule(rule: ResolvedRule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const sourceId = getSourceId(ctx);
    const targetId = getTargetId(ctx);

    if (sourceId !== targetId) {
      return false;
    }

    return super.executeRule(rule, ctx);
  }
}
