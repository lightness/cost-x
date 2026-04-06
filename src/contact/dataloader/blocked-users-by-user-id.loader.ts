import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import User from '../../user/entity/user.entity';
import { UserBlockService } from '../user-block.service';

@Injectable({ scope: Scope.REQUEST })
export class BlockedUsersByUserIdLoader extends BaseLoader<number, User[]> {
  constructor(
    private userBlockService: UserBlockService,
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(userIds: number[]): Promise<User[][]> {
    const userBlocks = await this.userBlockService.listByUserIds(userIds);
    const blockedUserIds = userBlocks.map((userBlock) => userBlock.blockedId);
    const blockedUsers = await this.prisma.user.findMany({
      where: {
        id: { in: blockedUserIds },
      },
    });
    const blockedUsersById = this.groupService.mapBy(blockedUsers, 'id');

    const blockedUsersByBlockerUserId = this.groupService.groupBy(userBlocks, 'blockerId');

    return userIds.map((userId) =>
      (blockedUsersByBlockerUserId.get(userId) || []).map((userBlock) =>
        blockedUsersById.get(userBlock.blockedId),
      ),
    );
  }
}
