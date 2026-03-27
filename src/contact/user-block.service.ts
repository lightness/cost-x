import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactService } from './contact.service';
import { UserBlock } from './entity/user-block.entity';

@Injectable()
export class UserBlockService {
  constructor(
    private prisma: PrismaService,
    private contactService: ContactService,
  ) {}

  async blockUser(
    blockedUserId: number,
    blockerUserId: number,
    currentUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<UserBlock> {
    const userBlock = await tx.userBlock.create({
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
      },
    });

    await this.contactService.removeContactPairByUserIds(
      blockedUserId,
      blockerUserId,
      currentUserId,
      tx,
    );

    return userBlock;
  }

  async removeUserBlock(
    blockedUserId: number,
    blockerUserId: number,
    currentUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<UserBlock> {
    return tx.userBlock.update({
      data: {
        removedAt: new Date(),
        removedByUser: {
          connect: { id: currentUserId },
        },
      },
      where: {
        blockerId_blockedId: {
          blockedId: blockedUserId,
          blockerId: blockerUserId,
        },
        removedAt: null,
      },
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
