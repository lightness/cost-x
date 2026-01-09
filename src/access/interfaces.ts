import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../user/entities/user-role.enum';

export enum AccessAction {
  ALLOW = 'allow',
  DENY = 'deny',
}

export enum AccessScope {
  USER = 'user',
  WORKSPACE = 'workspace',
  ITEM = 'item',
  PAYMENT = 'payment',
  GLOBAL = 'global',
}

export interface Rule {
  sourceScope?: AccessScope;     // Default 'user'
  sourceId?: GetId;              // Default ctx.getContext().req.user.id
  targetScope: AccessScope;
  targetId?: GetId;
  role: UserRole | UserRole[];
}

export type RuleOperationAnd = { and: (Rule | RuleOperationOr)[] };
export type RuleOperationOr = { or: (Rule | RuleOperationAnd)[] };
export type RuleDef = Rule | Rule[] | RuleOperationAnd | RuleOperationOr;

export type GetId = (ctx: GqlExecutionContext) => number;
