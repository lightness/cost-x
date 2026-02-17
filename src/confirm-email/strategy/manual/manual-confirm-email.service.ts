import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { MailService } from '../../../mail/mail.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../../token/token.service';
import { UserStatus } from '../../../user/entity/user-status.enum';
import { User } from '../../../user/entity/user.entity';
import { JwtPayload } from '../../interfaces';
import { CONFIRM_EMAIL_TOKEN_SERVICE } from '../../symbols';
import { IConfirmEmailStrategy } from '../interfaces';

@Injectable()
export class ManualConfirmEmailService implements IConfirmEmailStrategy {
  constructor(
    @Inject(CONFIRM_EMAIL_TOKEN_SERVICE)
    private tokenService: TokenService<JwtPayload>,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  initiateFlow(user: User): Promise<User> {
    return this.sendConfirmEmail(user);
  }

  async sendConfirmEmail(user: User) {
    const updatedUser = await this.prisma.user.update({
      data: {
        status: UserStatus.EMAIL_NOT_VERIFIED,
        tempCode: uuid(),
      },
      where: {
        id: user.id,
      },
    });

    const { id, tempCode } = updatedUser;

    const token = await this.tokenService.createToken({ id, tempCode });

    await this.mailService.sendConfirmEmail(user, token);

    return updatedUser;
  }

  async confirmEmail(token: string) {
    let tokenData: JwtPayload;

    try {
      tokenData = await this.tokenService.verifyToken(token);
    } catch (_e) {
      throw new BadRequestException(`Token is invalid`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: tokenData.id },
    });

    if (
      !user ||
      user.tempCode !== tokenData.tempCode ||
      user.status !== UserStatus.EMAIL_NOT_VERIFIED
    ) {
      throw new BadRequestException(`Token is invalid`);
    }

    await this.prisma.user.update({
      data: {
        status: UserStatus.ACTIVE,
        tempCode: null,
      },
      where: {
        id: user.id,
      },
    });

    return { message: 'User activated' };
  }
}
