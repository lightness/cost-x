import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PermissionService, UserPermissionRecord } from '../permission.service';
import { fromReq } from '../function/from-req.function';
import { Rule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class GlobalAccessStrategy implements AccessStrategy {
  constructor(private permissionService: PermissionService) {}

  isApplicable(rule: Rule): boolean {
    return rule.permission !== undefined && rule.targetScope === undefined;
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    if (!rule.permission || !rule.level) {
      return false;
    }

    const userPermissions = fromReq<UserPermissionRecord[]>('user.permissions')(ctx);

    if (!userPermissions) {
      return false;
    }

    return this.permissionService.hasPermission(userPermissions, rule.permission, rule.level);
  }
}
