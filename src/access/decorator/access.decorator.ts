import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/entity/user-role.enum';
import { AccessAction, AccessScope } from '../interfaces';

export const ACCESS_METADATA_KEY = 'access';

export interface Rule {
  targetScope: AccessScope;
  target?: string;
  role: UserRole | UserRole[];
}

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
