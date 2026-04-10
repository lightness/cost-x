import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class PermissionsByUserIdLoader extends BaseLoader<number, Record<string, number>> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(userIds: number[]): Promise<Record<string, number>[]> {
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId: { in: userIds } },
    });

    const permissionsByUserId = this.groupService.groupBy(userPermissions, 'userId');

    return userIds.map((userId) => {
      const permissions = permissionsByUserId.get(userId) || [];

      return Object.fromEntries(permissions.map((p) => [p.permission, p.accessLevel]));
    });
  }
}
