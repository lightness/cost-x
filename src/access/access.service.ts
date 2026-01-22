import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { fromReq } from './function/from-req.function';
import {
  AccessAction,
  AccessScope,
  Rule,
  RuleDef,
  RuleOperationAnd,
  RuleOperationOr,
} from './interfaces';
import { RuleEngineService } from './rule-engine.service';

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
      const subRuleResults = await Promise.all(ruleDef.map((subRuleDef) => this.isRuleMatch(subRuleDef, ctx)));

      return subRuleResults.some((result) => result, subRuleResults.some((result) => result));
    }

    if (this.isRuleOperatorOr(ruleDef)) {
      const subRuleResults = await Promise.all(ruleDef.or.map((subRuleDef) => this.isRuleMatch(subRuleDef, ctx)));

      return subRuleResults.some((result) => result);
    }

    if (this.isRuleOperatorAnd(ruleDef)) {
      const subRuleResults = await Promise.all(ruleDef.and.map((subRuleDef) => this.isRuleMatch(subRuleDef, ctx)));

      return subRuleResults.every((result) => result);
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
