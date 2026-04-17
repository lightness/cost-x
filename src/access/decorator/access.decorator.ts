import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permission.enum';
import { UserRole } from '../../user/entity/user-role.enum';
import { AccessAction, AccessScope, WorkspaceRole } from '../interfaces';

export const ACCESS_METADATA_KEY = 'access';

export interface SelfRule {
  self: string;
}

export interface TargetRule {
  scope: AccessScope;
  target?: string;
  role?: UserRole | UserRole[];
  workspaceRole?: WorkspaceRole | WorkspaceRole[];
}

export interface PermissionRule {
  scope: AccessScope.USER;
  permission: Permission | Permission[];
}

export type Rule = SelfRule | TargetRule | PermissionRule;

export type RuleOperationAnd = { and: (RuleDef | RuleOperationOr)[] };
export type RuleOperationOr = { or: (RuleDef | RuleOperationAnd)[] };
export type RuleDef = Rule | RuleDef[] | RuleOperationAnd | RuleOperationOr;

export interface AccessMetadata {
  action: AccessAction;
  ruleDef: RuleDef;
}

const allow = (ruleDef: RuleDef) =>
  SetMetadata(ACCESS_METADATA_KEY, { action: AccessAction.ALLOW, ruleDef });

const deny = (ruleDef: RuleDef) =>
  SetMetadata(ACCESS_METADATA_KEY, { action: AccessAction.DENY, ruleDef });

export const Access = {
  allow,
  deny,
};
