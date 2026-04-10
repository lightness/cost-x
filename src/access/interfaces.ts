import { GqlExecutionContext } from '@nestjs/graphql';
import { Permission } from './entity/permission.enum';

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
  WORKSPACE_MEMBER = 'workspace-member',
}

export enum PermissionLevel {
  OWNER = 1,
  ADMIN = 2,
}

export enum WorkspaceRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

export interface Rule {
  sourceScope?: AccessScope; // Default 'user'
  sourceId?: GetId; // Default ctx.getContext().req.user.id
  targetScope?: AccessScope;
  targetId?: GetId;
  permission?: Permission | Permission[];
  level?: PermissionLevel; // for global rules only (no targetScope)
  workspaceRole?: WorkspaceRole; // for workspace-scoped rules (targetScope set)
  metadata?: Record<string, unknown>;
}

export type RuleOperationAnd = { and: (RuleDef | RuleOperationOr)[] };
export type RuleOperationOr = { or: (RuleDef | RuleOperationAnd)[] };
export type RuleDef = Rule | RuleDef[] | RuleOperationAnd | RuleOperationOr;

export type GetId = (ctx: GqlExecutionContext) => number;
