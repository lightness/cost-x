import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { MailService } from '../mail/mail.service';
import { BcryptService } from '../password/bcrypt.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { UserStatus } from '../user/entities/user-status.enum';
import { ForgotPasswordInDto, ResetPasswordInDto } from './dto';
import { JwtPayload } from './interfaces';
import { RESET_PASSWORD_TOKEN_SERVICE } from './symbols';

@Injectable()
export class ResetPasswordService {
  constructor(
    @Inject(RESET_PASSWORD_TOKEN_SERVICE)
    private tokenService: TokenService<JwtPayload>,
    private prisma: PrismaService,
    private mailService: MailService,
    private bcryptService: BcryptService,
  ) {}

  async sendForgotPasswordEmail(dto: ForgotPasswordInDto) {
    const { email } = dto;

    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException(`User with such email not exists`);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(`User is not active`);
    }

    const tempCode = uuid();

    await this.prisma.user.update({
      data: { tempCode },
      where: { id: user.id },
    });

    const token = await this.tokenService.createToken({
      id: user.id,
      tempCode,
    });

    return this.mailService.sendResetPassword(user, token);
  }

  async resetPassword(dto: ResetPasswordInDto) {
    const { token, password } = dto;

    const payload = await this.tokenService.verifyToken(token);

    if (!payload?.id || !payload?.tempCode) {
      throw new BadRequestException(`Wrong token format`);
    }

    const { id, tempCode } = payload;

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new BadRequestException(`User not exists`);
    }

    if (user.tempCode !== tempCode) {
      throw new BadRequestException(`Temp token is already used`);
    }

    await this.prisma.user.update({
      data: {
        password: await this.bcryptService.hashPassword(password),
        tempCode: '',
      },
      where: { id },
    });
  }
}
