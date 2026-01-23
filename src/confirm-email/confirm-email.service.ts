import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { UserStatus } from '../user/entities/user-status.enum';
import { User } from '../user/entities/user.entity';
import { JwtPayload } from './interface';
import { CONFIRM_EMAIL_TOKEN_SERVICE } from './symbols';

@Injectable()
export class ConfirmEmailService {
  constructor(
    @Inject(CONFIRM_EMAIL_TOKEN_SERVICE)
    private tokenService: TokenService<JwtPayload>,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async sendConfirmEmail(user: User) {
    const { id, tempCode } = user;

    const token = await this.tokenService.createToken({ id, tempCode });

    return this.mailService.sendConfirmEmail(user, token);
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
