import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign, verify } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from './entities/user-status.enum';
import { User } from './entities/user.entity';

@Injectable()
export class ConfirmEmailService {
  constructor(
    private configService: ConfigService, 
    private prisma: PrismaService,
  ) { }

  private get jwtSecret() {
    return this.configService.getOrThrow('mailersend.confirmEmail.jwt.secret');
  }

  private get jwtTtl() {
    return this.configService.getOrThrow('mailersend.confirmEmail.jwt.ttl');
  }

  createConfirmEmailToken(user: User) {
    const { id, tempCode } = user;

    const token = sign({ id, tempCode }, this.jwtSecret, { expiresIn: this.jwtTtl });

    return token;
  }

  async confirmEmail(token: string) {
    let tokenData;

    try {
      tokenData = await new Promise((resolve, reject) => {
        verify(token, this.jwtSecret, (error, value) => {
          if (error) {
            reject(error);
          } else {
            resolve(value);
          }
        });
      });
    } catch (e) {
      throw new BadRequestException(`Token is invalid`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: tokenData.id } });

    if (!user || user.tempCode !== tokenData.tempCode || user.status !== UserStatus.EMAIL_NOT_VERIFIED) {
      throw new BadRequestException(`Token is invalid`);
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        status: UserStatus.ACTIVE,
        tempCode: null,
      },
    });

    return { message: 'User activated' };
  }
}
