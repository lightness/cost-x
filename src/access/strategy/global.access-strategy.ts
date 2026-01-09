import { Injectable } from '@nestjs/common';
import { AccessScope, Rule } from '../interfaces';
import { GqlExecutionContext } from '@nestjs/graphql';
import { fromReq } from '../function/from-req.function';
import { UserRole } from '../../user/entities/user-role.enum';

@Injectable()
export class GlobalAccessStrategy {
  isApplicable(rule: Rule): boolean {
    return rule.targetScope === AccessScope.GLOBAL;
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const currentUserRole = fromReq<UserRole>('user.role')(ctx);
    const requiredRoles = Array.isArray(rule.role) ? rule.role : [rule.role];

    return requiredRoles.includes(currentUserRole);
  }
}