import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Rule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class FormalAccessStrategy implements AccessStrategy {
  isApplicable(rule: Rule): boolean {
    return rule.targetScope === rule.sourceScope;
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const { sourceId: getSourceId, targetId: getTargetId } = rule;

    const sourceId = getSourceId(ctx);
    const targetId = getTargetId(ctx);

    return sourceId === targetId;
  }
}
