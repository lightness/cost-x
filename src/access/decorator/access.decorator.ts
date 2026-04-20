import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permission.enum';
import { UserRole } from '../../user/entity/user-role.enum';
import { AccessAction, AccessScope, WorkspacePermission, WorkspaceRole } from '../interfaces';

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

export interface WorkspaceOwnerRule {
  scope: AccessScope.WORKSPACE;
  owner: string;
}

export interface WorkspacePermissionRule {
  scope: AccessScope.WORKSPACE;
  target: string;
  permission: WorkspacePermission | WorkspacePermission[];
}

export type Rule =
  | SelfRule
  | TargetRule
  | PermissionRule
  | WorkspaceOwnerRule
  | WorkspacePermissionRule;

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
