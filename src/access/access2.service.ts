import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InferEntry } from '../common/decorator/infer.decorator';
import {
  Rule2,
  RuleDef2,
  RuleOperationAnd2,
  RuleOperationOr2,
} from './decorator/access2.decorator';
import { fromReq } from './function/from-req.function';
import { AccessAction, AccessScope, Rule } from './interfaces';
import { RuleEngineService } from './rule-engine.service';

@Injectable()
export class Access2Service {
  constructor(
    private moduleRef: ModuleRef,
    private ruleEngineService: RuleEngineService,
  ) {}

  async hasAccess(
    action: AccessAction,
    ruleDef: RuleDef2,
    inferEntries: InferEntry[],
    ctx: GqlExecutionContext,
  ): Promise<boolean> {
    const inferredEntities = await this.resolveInferredEntities(inferEntries, ctx);
    const matches = await this.isRuleMatch(ruleDef, ctx, inferredEntities);

    return action === AccessAction.ALLOW ? matches : !matches;
  }

  private async resolveInferredEntities(
    entries: InferEntry[],
    ctx: GqlExecutionContext,
  ): Promise<Map<string, unknown>> {
    const entryByKey = new Map(entries.map((e) => [e.key, e]));
    const inFlight = new Map<string, Promise<unknown>>();

    const resolve = (key: string): Promise<unknown> => {
      if (inFlight.has(key)) {
        return inFlight.get(key);
      }

      const entry = entryByKey.get(key);

      if (!entry) {
        throw new InternalServerErrorException(
          `@Infer key "${key}" referenced but not defined`,
        );
      }

      const promise = (async () => {
        let value: unknown =
          typeof entry.options.from === 'string'
            ? await resolve(entry.options.from)
            : entry.options.from(ctx);

        for (const PipeClass of entry.options.pipes) {
          const pipe = await this.moduleRef.create(PipeClass);
          value = await pipe.transform(value as never, {
            data: undefined,
            metatype: undefined,
            type: 'custom',
          });
        }

        return value;
      })();

      inFlight.set(key, promise);

      return promise;
    };

    const values = await Promise.all(entries.map(({ key }) => resolve(key)));
    const resolved = new Map(entries.map(({ key }, i) => [key, values[i]]));

    return resolved;
  }

  private async isRuleMatch(
    ruleDef: RuleDef2,
    ctx: GqlExecutionContext,
    inferredEntities: Map<string, unknown>,
  ): Promise<boolean> {
    if (Array.isArray(ruleDef)) {
      const results = await Promise.all(
        ruleDef.map((sub) => this.isRuleMatch(sub, ctx, inferredEntities)),
      );

      return results.some((r) => r);
    }

    if (this.isOperatorOr(ruleDef)) {
      const results = await Promise.all(
        ruleDef.or.map((sub) => this.isRuleMatch(sub, ctx, inferredEntities)),
      );

      return results.some((r) => r);
    }

    if (this.isOperatorAnd(ruleDef)) {
      const results = await Promise.all(
        ruleDef.and.map((sub) => this.isRuleMatch(sub, ctx, inferredEntities)),
      );

      return results.every((r) => r);
    }

    if (this.isRule2(ruleDef)) {
      return this.executeRule2(ruleDef, ctx, inferredEntities);
    }

    throw new InternalServerErrorException(`Access2 rule is malformed: ${JSON.stringify(ruleDef)}`);
  }

  private async executeRule2(
    rule: Rule2,
    ctx: GqlExecutionContext,
    inferredEntities: Map<string, unknown>,
  ): Promise<boolean> {
    const { target, ...rest } = rule;

    const normalizedRule: Rule = {
      sourceId: fromReq('user.id'),
      sourceScope: AccessScope.USER,
      ...rest,
      role: Array.isArray(rule.role) ? rule.role : [rule.role],
      ...(target !== undefined && {
        targetId: () => (inferredEntities.get(target) as { id: number }).id,
      }),
    };

    return this.ruleEngineService.executeRule(normalizedRule, ctx);
  }

  private isRule2(ruleDef: RuleDef2): ruleDef is Rule2 {
    return 'targetScope' in ruleDef;
  }

  private isOperatorOr(ruleDef: RuleDef2): ruleDef is RuleOperationOr2 {
    return 'or' in ruleDef;
  }

  private isOperatorAnd(ruleDef: RuleDef2): ruleDef is RuleOperationAnd2 {
    return 'and' in ruleDef;
  }
}
