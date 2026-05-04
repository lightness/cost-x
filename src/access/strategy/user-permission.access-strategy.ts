import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessScope, ResolvedRule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserPermissionAccessStrategy implements AccessStrategy {
  constructor(private prisma: PrismaService) {}

  isApplicable(rule: ResolvedRule): boolean {
    return rule.scope === AccessScope.USER && rule.permissions !== undefined;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const sourceUser = rule.sourceEntity as { id: number };

    const count = await this.prisma.userPermission.count({
      where: {
        permission: { in: rule.permissions },
        userId: sourceUser.id,
      },
    });

    return count === rule.permissions.length;
  }
}
