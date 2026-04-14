import { GqlExecutionContext } from '@nestjs/graphql';
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
  sourceScope?: AccessScope; // Default 'user'
  sourceId?: GetId; // Default ctx.getContext().req.user.id
  targetScope: AccessScope;
  targetId?: GetId;
  role: UserRole | UserRole[];
  metadata?: Record<string, unknown>;
}

export type GetId = (ctx: GqlExecutionContext) => number;
