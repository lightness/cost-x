import { Permission, WorkspacePermission } from '../../generated/prisma/client';
import { UserRole } from '../user/entity/user-role.enum';

export { WorkspacePermission };

export enum AccessAction {
  ALLOW = 'allow',
  DENY = 'deny',
}

export enum AccessScope {
  USER = 'user',
  WORKSPACE = 'workspace',
}

export enum WorkspaceRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

export interface ResolvedRule {
  sourceEntity?: unknown;
  scope: AccessScope;
  targetEntity?: unknown;
  role?: UserRole[];
  workspaceRole?: WorkspaceRole[];
  self?: boolean;
  permissions?: Permission[];
  ownerCheck?: boolean;
  workspacePermissions?: WorkspacePermission[];
}
