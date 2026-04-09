import { GqlExecutionContext } from '@nestjs/graphql';
import { Permission } from '../../generated/prisma/enums';

export { Permission };

export enum AccessAction {
  ALLOW = 'allow',
  DENY = 'deny',
}

export enum AccessScope {
  CONTACT = 'contact',
  USER = 'user',
  WORKSPACE = 'workspace',
  ITEM = 'item',
  TAG = 'tag',
  PAYMENT = 'payment',
  INVITE = 'invite',
  USER_BLOCK = 'user-block',
}

export enum PermissionLevel {
  OWNER = 1,
  ADMIN = 2,
}

export interface Rule {
  sourceScope?: AccessScope; // Default 'user'
  sourceId?: GetId; // Default ctx.getContext().req.user.id
  targetScope?: AccessScope;
  targetId?: GetId;
  permission?: Permission | Permission[];
  level?: PermissionLevel;
  metadata?: Record<string, unknown>;
}

export type RuleOperationAnd = { and: (RuleDef | RuleOperationOr)[] };
export type RuleOperationOr = { or: (RuleDef | RuleOperationAnd)[] };
export type RuleDef = Rule | RuleDef[] | RuleOperationAnd | RuleOperationOr;

export type GetId = (ctx: GqlExecutionContext) => number;
