import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import User from '../entity/user.entity';

@Injectable({ scope: Scope.REQUEST })
export class UserByUserIdLoader extends BaseLoader<number, User> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(userIds: number[]): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
    });

    return this.groupService.sortBy(users, 'id', userIds);
  }
}
