import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign, verify } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../password/bcrypt.service';
import { User } from '../user/entities/user.entity';
import { AuthInDto, AuthOutDto } from './dto';
import { JwtConfig, TokenPayload } from './interfaces';
import { UserStatus } from '../user/entities/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private bcryptService: BcryptService,
  ) { }

  async authenticate(dto: AuthInDto): Promise<AuthOutDto> {
    console.log('🔮');
    const { email, password } = dto;

    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    console.log('🔮 user', user);

    if (!user) {
      throw this.unauthorizedException;
    }

    const isPasswordCorrect = await this.bcryptService.comparePasswords(password, user.password);

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
      this.createAccessToken(user),
      this.createRefreshToken(user),
    ]);

    return {
      accessToken,
      refreshToken,
    }
  }

  async verifyAccessToken(token: string): Promise<User> {
    const { secret } = this.accessJwtConfig;

    const content = await new Promise((resolve, reject) => verify(token, secret, (error, value) => {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    }));

    if (!this.isTokenPayload(content)) {
      throw this.unauthorizedException;
    }

    const { id } = content;

    return this.prisma.user.findUnique({
      where: { id },
    });
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

  private async createAccessToken(user: User): Promise<string> {
    const { secret, ttl } = this.accessJwtConfig;

    return sign({ id: user.id }, secret, { expiresIn: ttl });
  }

  private async createRefreshToken(user: User): Promise<string> {
    const { secret, ttl } = this.refreshJwtConfig;

    return sign({ id: user.id }, secret, { expiresIn: ttl });
  }

  private get accessJwtConfig(): JwtConfig {
    return this.configService.getOrThrow<JwtConfig>('authenticate.access.jwt');
  }

  private get refreshJwtConfig(): JwtConfig {
    return this.configService.getOrThrow<JwtConfig>('authenticate.refresh.jwt');
  }

  private isTokenPayload(value: unknown): value is TokenPayload {
    return typeof value === 'object' && Boolean((value as any).id);
  }
}