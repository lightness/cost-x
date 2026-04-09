import { Injectable } from '@nestjs/common';
import { Permission, PermissionLevel } from './interfaces';

export interface UserPermissionRecord {
  permission: Permission;
  accessLevel: number;
}

@Injectable()
export class PermissionService {
  hasLevel(accessLevel: number, requiredLevel: PermissionLevel): boolean {
    return (accessLevel & requiredLevel) !== 0;
  }

  hasPermission(
    userPermissions: UserPermissionRecord[],
    permission: Permission | Permission[],
    level: PermissionLevel,
  ): boolean {
    const required = Array.isArray(permission) ? permission : [permission];

    return required.some((p) =>
      userPermissions.some((up) => up.permission === p && this.hasLevel(up.accessLevel, level)),
    );
  }
}
