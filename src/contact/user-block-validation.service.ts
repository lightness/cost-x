import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/browser';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../user/entity/user.entity';
import { CreateUserBlockInDto } from './dto';
import { BlockedUserNotFoundError, SelfBlockForbiddenError } from './error';

@Injectable()
export class UserBlockValidationService {
  constructor(private prisma: PrismaService) {}

  async validateCreateUserBlock(
    dto: CreateUserBlockInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    this.validateBlockerAndBlockedAreDistinct(dto.blockerId, dto.blockedId);
    await this.validateBlockedUserExists(dto.blockedId, tx);
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
}
