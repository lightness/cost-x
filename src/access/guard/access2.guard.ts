import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  INFER_METADATA_KEY,
  InferEntry,
} from '../../common/decorator/infer.decorator';
import {
  ACCESS2_METADATA_KEY,
  Access2Metadata,
  Rule2,
  RuleDef2,
  RuleOperationAnd2,
  RuleOperationOr2,
} from '../decorator/access2.decorator';
import { NoAccessError } from '../error/no-access.error';
import { fromReq } from '../function/from-req.function';
import { AccessAction, AccessScope, Rule } from '../interfaces';
import { RuleEngineService } from '../rule-engine.service';

@Injectable()
export class Access2Guard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
    private ruleEngineService: RuleEngineService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const access2Metadata = this.reflector.getAllAndOverride<Access2Metadata>(
      ACCESS2_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!access2Metadata) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);

    if (!ctx.getContext().req.user) {
      throw new NoAccessError();
    }

    const inferEntries =
      this.reflector.getAllAndOverride<InferEntry[]>(INFER_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const inferredEntities = await this.resolveInferredEntities(inferEntries, ctx);

    const { action, ruleDef } = access2Metadata;
    const matches = await this.isRuleMatch(ruleDef, ctx, inferredEntities);
    const hasAccess = action === AccessAction.ALLOW ? matches : !matches;

    if (!hasAccess) {
      throw new NoAccessError();
    }

    return true;
  }

  private async resolveInferredEntities(
    entries: InferEntry[],
    ctx: GqlExecutionContext,
  ): Promise<Map<string, unknown>> {
    const map = new Map<string, unknown>();

    await Promise.all(
      entries.map(async ({ key, options }) => {
        let value: unknown = options.from(ctx);

        for (const PipeClass of options.pipes) {
          const pipe = await this.moduleRef.create(PipeClass);
          value = await pipe.transform(value as never, { type: 'custom', data: undefined, metatype: undefined });
        }

        map.set(key, value);
      }),
    );

    return map;
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

    throw new InternalServerErrorException(
      `Access2 rule is malformed: ${JSON.stringify(ruleDef)}`,
    );
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
