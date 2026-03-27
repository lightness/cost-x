import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/browser';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../user/entity/user.entity';
import { CreateUserBlockInDto, RemoveUserBlockInDto } from './dto';
import {
  BlockedUserNotFoundError,
  SelfBlockForbiddenError,
  UserIsAlreadyBlockedError,
  UserIsNotBlockedError,
} from './error';

@Injectable()
export class UserBlockValidationService {
  constructor(private prisma: PrismaService) {}

  async validateCreateUserBlock(
    dto: CreateUserBlockInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    this.validateBlockerAndBlockedAreDistinct(dto.blockerId, dto.blockedId);
    await this.validateBlockedUserExists(dto.blockedId, tx);
    await this.validateNoUserBlockExists(dto.blockerId, dto.blockedId, tx);
  }

  async validateRemoveUserBlock(
    dto: RemoveUserBlockInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    this.validateBlockerAndBlockedAreDistinct(dto.blockerId, dto.blockedId);
    await this.validateUserBlockExists(dto.blockerId, dto.blockedId, tx);
  }

  private validateBlockerAndBlockedAreDistinct(blockerId: number, blockedId: number) {
    if (blockerId === blockedId) {
      throw new SelfBlockForbiddenError();
    }
  }

  private async validateBlockedUserExists(
    blockedUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<User> {
    const user = await tx.user.findUnique({ where: { id: blockedUserId } });

    if (!user) {
      throw new BlockedUserNotFoundError();
    }

    return user;
  }

  private async validateUserBlockExists(
    blockerId: number,
    blockedId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const userBlock = await tx.userBlock.findFirst({
      where: {
        blockedId,
        blockerId,
        removedAt: null,
      },
    });

    if (!userBlock) {
      throw new UserIsNotBlockedError();
    }

    return userBlock;
  }

  private async validateNoUserBlockExists(
    blockerId: number,
    blockedId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const userBlock = await tx.userBlock.findFirst({
      where: {
        blockedId,
        blockerId,
        removedAt: null,
      },
    });

    if (userBlock) {
      throw new UserIsAlreadyBlockedError();
    }
  }

  // private async validateUserBlockIsActive(userBlock: UserBlock) {
  //   if (userBlock.removedAt || userBlock.removedByUserId) {
  //   }
  // }
}
