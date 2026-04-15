import { Injectable } from '@nestjs/common';
import { UserRole } from '../../user/entity/user-role.enum';
import { AccessScope, ResolvedRule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class GlobalAccessStrategy implements AccessStrategy {
  isApplicable(rule: ResolvedRule): boolean {
    return rule.targetScope === AccessScope.GLOBAL;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const sourceUser = rule.sourceEntity as { role: UserRole };
    const requiredRoles = Array.isArray(rule.role) ? rule.role : [rule.role];

    return requiredRoles.includes(sourceUser.role);
  }
}
