import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { BcryptService } from '../password/bcrypt.service';
import type { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '../user/entities/user-status.enum';
import type { AuthInDto, AuthOutDto } from './dto';
import type { TokenService } from '../token/token.service';
import { ACCESS_TOKEN_SERVICE, REFRESH_TOKEN_SERVICE } from './symbols';
import type { JwtPayload } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    @Inject(ACCESS_TOKEN_SERVICE)
    private accessTokenService: TokenService<JwtPayload>,
    @Inject(REFRESH_TOKEN_SERVICE)
    private refreshTokenService: TokenService<JwtPayload>,
    private prisma: PrismaService,
    private bcryptService: BcryptService,
  ) {}

  async authenticate(dto: AuthInDto): Promise<AuthOutDto> {
    const { email, password } = dto;

    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw this.unauthorizedException;
    }

    const isPasswordCorrect = await this.bcryptService.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw this.unauthorizedException;
    }

    if (user.status === UserStatus.EMAIL_NOT_VERIFIED) {
      throw this.emailNotConfirmedException;
    }

    if (user.status === UserStatus.BANNED) {
      throw this.userIsBannedException;
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.accessTokenService.createToken({ id: user.id }),
      this.refreshTokenService.createToken({ id: user.id }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private get unauthorizedException() {
    return new UnauthorizedException(`Not authorized`);
  }

  private get emailNotConfirmedException() {
    return new UnauthorizedException(`Email address is not confirmed`);
  }

  private get userIsBannedException() {
    return new UnauthorizedException(`User is banned`);
  }
}
