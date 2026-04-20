import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPermission } from '../entity/user-permission.entity';

@Injectable({ scope: Scope.REQUEST })
export class UserPermissionsByUserIdLoader extends BaseLoader<number, UserPermission[]> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(userIds: number[]): Promise<UserPermission[][]> {
    const permissions = await this.prisma.userPermission.findMany({
      where: { userId: { in: userIds } },
    });
    const byUserId = this.groupService.groupBy(permissions, 'userId');

    return userIds.map((userId) => byUserId.get(userId) || []);
  }
}
