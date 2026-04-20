import { Injectable } from '@nestjs/common';
import { UserRole } from '../../user/entity/user-role.enum';
import { AccessScope, ResolvedRule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserRoleAccessStrategy implements AccessStrategy {
  isApplicable(rule: ResolvedRule): boolean {
    return rule.scope === AccessScope.USER && rule.permissions === undefined && rule.self !== true;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const sourceUser = rule.sourceEntity as { id: number; role: UserRole };
    const requiredRoles = rule.role ?? [];

    if (!requiredRoles.includes(sourceUser.role)) {
      return false;
    }

    if (rule.targetEntity !== undefined) {
      const targetEntity = rule.targetEntity as { id: number };

      if (sourceUser.id !== targetEntity.id) {
        return false;
      }
    }

    return true;
  }
}
