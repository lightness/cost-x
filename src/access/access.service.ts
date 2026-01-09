import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../user/entities/user-role.enum';
import { AccessAction, AccessScope, Rule, RuleDef, RuleOperationAnd, RuleOperationOr } from './interfaces';
import { fromReq } from './function/from-req.function';

@Injectable()
export class AccessService {
  constructor() {}

  private normalizeRule(rule: Rule): Rule {
    return {
      sourceScope: AccessScope.USER,
      sourceId: fromReq('user.id'),
      ...rule,
      role: Array.isArray(rule.role) ? rule.role : [rule.role],
    }
  }

  async hasAccess(action: AccessAction, ruleDef: RuleDef, ctx: GqlExecutionContext): Promise<boolean> {
    if (action === AccessAction.ALLOW) {
      return this.isRuleMatch(ruleDef, ctx);
    } else {
      return !this.isRuleMatch(ruleDef, ctx);
    }
  }

  private async isRuleMatch(ruleDef: RuleDef, ctx: GqlExecutionContext): Promise<boolean> {
    if (Array.isArray(ruleDef)) {
      return ruleDef.some((subRuleDef) => this.isRuleMatch(subRuleDef, ctx));
    }

    if (this.isRuleOperatorOr(ruleDef)) {
      return ruleDef.or.some((subRuleDef) => this.isRuleMatch(subRuleDef, ctx));
    }

    if (this.isRuleOperatorAnd(ruleDef)) {
      return ruleDef.and.every((subRuleDef) => this.isRuleMatch(subRuleDef, ctx));
    }

    if (this.isRule(ruleDef)) {
      return this.processRule(ruleDef, ctx);
    }

    throw new InternalServerErrorException(`Access rule is wrong: ${JSON.stringify(ruleDef)}`);
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

  private async processRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const normalizedRule = this.normalizeRule(rule);
    const { sourceScope, sourceId: getSourceId, targetScope, targetId: getTargetId, role } = normalizedRule;

    // TODO: Rewrite
    if (targetScope === AccessScope.GLOBAL) {
      return role.includes(this.getCurrentUserRole(ctx));
    }

    if (sourceScope === targetScope) {
      const sourceId = getSourceId(ctx);
      const targetId = getTargetId(ctx);

      if (sourceId !== targetId) {
        return false;
      }

      return role.includes(this.getCurrentUserRole(ctx));
    } else {
      throw new InternalServerErrorException(`Not implemented yet (scopes)`)
    }
  }

  private getCurrentUserRole(ctx: GqlExecutionContext): UserRole {
    return ctx.getContext()?.req?.user?.role
  }
}