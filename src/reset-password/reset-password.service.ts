import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Prisma } from '../../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { BcryptService } from '../password/bcrypt.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import User from '../user/entity/user.entity';
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

  async sendForgotPasswordEmail(
    dto: ForgotPasswordInDto,
    generateTempCode = true,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const { email } = dto;

    let user = await tx.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException(`User with such email not exists`);
    }

    if (user.confirmEmailTempCode !== null || user.isBanned) {
      throw new BadRequestException(`User is not active`);
    }

    if (generateTempCode) {
      user = await tx.user.update({
        data: { resetPasswordTempCode: uuid() },
        where: { id: user.id },
      });
    }

    const token = await this.tokenService.createToken({
      id: user.id,
      tempCode: user.resetPasswordTempCode,
    });

    return this.mailService.sendResetPassword(user, token);
  }

  async createTokenFromExistingCode(user: Pick<User, 'id' | 'resetPasswordTempCode'>): Promise<string> {
    return this.tokenService.createToken({ id: user.id, tempCode: user.resetPasswordTempCode });
  }

  async resetPassword(dto: ResetPasswordInDto, tx: Prisma.TransactionClient = this.prisma) {
    const { token, password } = dto;

    const payload = await this.tokenService.verifyToken(token);

    if (!payload?.id || !payload?.tempCode) {
      throw new BadRequestException(`Wrong token format`);
    }

    const { id, tempCode } = payload;

    const user = await tx.user.findUnique({ where: { id } });

    if (!user) {
      throw new BadRequestException(`User not exists`);
    }

    if (user.resetPasswordTempCode !== tempCode) {
      throw new BadRequestException(`Temp token is already used`);
    }

    await tx.user.update({
      data: {
        password: await this.bcryptService.hashPassword(password),
        resetPasswordTempCode: null,
      },
      where: { id },
    });
  }
}
