import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserBlock } from './entity/user-block.entity';

@Injectable()
export class UserBlockService {
  constructor(private prisma: PrismaService) {}

  async blockUser(
    blockedUserId: number,
    blockerUserId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<UserBlock> {
    const client = tx || this.prisma;

    return client.userBlock.create({
      data: {
        blocked: {
          connect: {
            id: blockedUserId,
          },
        },
        blocker: {
          connect: {
            id: blockerUserId,
          },
        },
        createdAt: new Date(),
      },
    });
  }

  async removeUserBlock(
    userBlockId: number,
    removedByUserId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<UserBlock> {
    const client = tx || this.prisma;

    return client.userBlock.update({
      data: {
        removedAt: new Date(),
        removedByUser: {
          connect: { id: removedByUserId },
        },
      },
      where: { id: userBlockId },
    });
  }

  async isUserBlockExists(
    blockedUserId: number,
    blockerUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const count = await tx.userBlock.count({
      where: {
        blockedId: blockedUserId,
        blockerId: blockerUserId,
        removedAt: null,
      },
    });

    return count > 0;
  }

  async listByUserIds(userIds: number[]): Promise<UserBlock[]> {
    const userBlocks = await this.prisma.userBlock.findMany({
      include: {
        blocker: true,
      },
      where: { blockerId: { in: userIds } },
    });

    return userBlocks;
  }
}
