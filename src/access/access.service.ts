import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { GqlExecutionContext } from '@nestjs/graphql';
import { fromReq } from './function/from-req.function';
import {
  AccessAction,
  AccessScope,
  type Rule,
  type RuleDef,
  type RuleOperationAnd,
  type RuleOperationOr,
} from './interfaces';
import type { RuleEngineService } from './rule-engine.service';

@Injectable()
export class AccessService {
  constructor(private ruleEngineService: RuleEngineService) {}

  private normalizeRule(rule: Rule): Rule {
    return {
      sourceScope: AccessScope.USER,
      sourceId: fromReq('user.id'),
      ...rule,
      role: Array.isArray(rule.role) ? rule.role : [rule.role],
    };
  }

  async hasAccess(
    action: AccessAction,
    ruleDef: RuleDef,
    ctx: GqlExecutionContext,
  ): Promise<boolean> {
    if (action === AccessAction.ALLOW) {
      return this.isRuleMatch(ruleDef, ctx);
    } else {
      return !this.isRuleMatch(ruleDef, ctx);
    }
  }

  private async isRuleMatch(
    ruleDef: RuleDef,
    ctx: GqlExecutionContext,
  ): Promise<boolean> {
    if (Array.isArray(ruleDef)) {
      return ruleDef.some((subRuleDef) => this.isRuleMatch(subRuleDef, ctx));
    }

    if (this.isRuleOperatorOr(ruleDef)) {
      return ruleDef.or.some((subRuleDef) => this.isRuleMatch(subRuleDef, ctx));
    }

    if (this.isRuleOperatorAnd(ruleDef)) {
      return ruleDef.and.every((subRuleDef) =>
        this.isRuleMatch(subRuleDef, ctx),
      );
    }

    if (this.isRule(ruleDef)) {
      return this.ruleEngineService.executeRule(
        this.normalizeRule(ruleDef),
        ctx,
      );
    }

    throw new InternalServerErrorException(
      `Access rule is wrong: ${JSON.stringify(ruleDef)}`,
    );
  }

  private isRule(ruleDef: RuleDef): ruleDef is Rule {
    return 'targetScope' in ruleDef;
  }

  private isRuleOperatorOr(ruleDef: RuleDef): ruleDef is RuleOperationOr {
    return 'or' in ruleDef;
  }

  private isRuleOperatorAnd(ruleDef: RuleDef): ruleDef is RuleOperationAnd {
    return 'and' in ruleDef;
  }
}
