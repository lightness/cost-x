import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserStatus } from '../../../user/entity/user-status.enum';
import { User } from '../../../user/entity/user.entity';
import { IConfirmEmailStrategy } from '../interfaces';

@Injectable()
export class AutoConfirmEmailService implements IConfirmEmailStrategy {
  constructor(private prisma: PrismaService) {}

  initiateFlow(user: User): Promise<User> {
    return this.activateEmailImmediately(user);
  }

  private async activateEmailImmediately(user: User): Promise<User> {
    return this.prisma.user.update({
      data: {
        status: UserStatus.ACTIVE,
        tempCode: null,
      },
      where: {
        id: user.id,
      },
    });
  }
}
