import { Inject, Injectable } from '@nestjs/common';
import { BcryptService } from '../password/bcrypt.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { UserStatus } from '../user/entity/user-status.enum';
import { User } from '../user/entity/user.entity';
import { AuthInDto, AuthOutDto } from './dto';
import { EmailNotVerifiedError } from './error/email-not-verified.error';
import { InvalidCredentialsError } from './error/invalid-credentials.error';
import { UserBannedError } from './error/user-banned.error';
import { JwtPayload } from './interfaces';
import { ACCESS_TOKEN_SERVICE, REFRESH_TOKEN_SERVICE } from './symbols';

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
      throw new InvalidCredentialsError();
    }

    const isPasswordCorrect = await this.bcryptService.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new InvalidCredentialsError();
    }

    return this.authenticateUser(user);
  }

  async authenticateUser(user: User): Promise<AuthOutDto> {
    if (user.status === UserStatus.EMAIL_NOT_VERIFIED) {
      throw new EmailNotVerifiedError();
    }

    if (user.status === UserStatus.BANNED) {
      throw new UserBannedError();
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.accessTokenService.createToken({ id: user.id }),
      this.refreshTokenService.createToken({ id: user.id }),
    ]);
    // TODO: Remove after testing e2e
    console.log('🔑✅ accessToken', accessToken);
    console.log('🔑✅ refreshToken', refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }
}
