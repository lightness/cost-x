import { UserRole } from '../user/entity/user-role.enum';

export enum AccessAction {
  ALLOW = 'allow',
  DENY = 'deny',
}

export enum AccessScope {
  USER = 'user',
  WORKSPACE = 'workspace',
  GLOBAL = 'global',
}

export interface ResolvedRule {
  sourceEntity?: unknown;
  targetScope: AccessScope;
  targetEntity?: unknown;
  role: UserRole | UserRole[];
}
