import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../../user/entity/user-role.enum';
import { fromReq } from '../function/from-req.function';
import { AccessScope, ResolvedRule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class GlobalAccessStrategy implements AccessStrategy {
  isApplicable(rule: ResolvedRule): boolean {
    return rule.targetScope === AccessScope.GLOBAL;
  }

  async executeRule(rule: ResolvedRule, ctx: GqlExecutionContext): Promise<boolean> {
    const currentUserRole = fromReq<UserRole>('user.role')(ctx);
    const requiredRoles = Array.isArray(rule.role) ? rule.role : [rule.role];

    return requiredRoles.includes(currentUserRole);
  }
}
