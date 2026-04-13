import { SetMetadata } from '@nestjs/common';
import { AccessAction, AccessScope, GetId } from '../interfaces';
import { UserRole } from '../../user/entity/user-role.enum';

export const ACCESS2_METADATA_KEY = 'access2';

export interface Rule2 {
  sourceScope?: AccessScope;
  sourceId?: GetId;
  targetScope: AccessScope;
  target?: string;
  role: UserRole | UserRole[];
  metadata?: Record<string, unknown>;
}

export type RuleOperationAnd2 = { and: (RuleDef2 | RuleOperationOr2)[] };
export type RuleOperationOr2 = { or: (RuleDef2 | RuleOperationAnd2)[] };
export type RuleDef2 = Rule2 | RuleDef2[] | RuleOperationAnd2 | RuleOperationOr2;

export interface Access2Metadata {
  action: AccessAction;
  ruleDef: RuleDef2;
}

const allow = (ruleDef: RuleDef2) =>
  SetMetadata(ACCESS2_METADATA_KEY, { action: AccessAction.ALLOW, ruleDef });

const deny = (ruleDef: RuleDef2) =>
  SetMetadata(ACCESS2_METADATA_KEY, { action: AccessAction.DENY, ruleDef });

export const Access2 = {
  allow,
  deny,
};
