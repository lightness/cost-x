import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import User from '../../../user/entity/user.entity';
import { IConfirmEmailStrategy } from '../interfaces';

@Injectable()
export class AutoConfirmEmailService implements IConfirmEmailStrategy {
  constructor(private prisma: PrismaService) {}

  initiateFlow(user: User, tx?: Prisma.TransactionClient): Promise<User> {
    return this.activateEmailImmediately(user, tx);
  }

  private async activateEmailImmediately(
    user: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<User> {
    return tx.user.update({
      data: {
        confirmEmailTempCode: null,
      },
      where: {
        id: user.id,
      },
    });
  }
}
