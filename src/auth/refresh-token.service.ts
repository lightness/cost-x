import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { AuthService } from './auth.service';
import { AuthOutDto } from './dto';
import { InvalidRefreshTokenError } from './error/invalid-refresh-token.error';
import { UnknownUserError } from './error/unknown-user.error';
import { JwtPayload } from './interfaces';
import { ACCESS_TOKEN_SERVICE, REFRESH_TOKEN_SERVICE } from './symbols';

@Injectable()
export class RefreshTokenService {
  constructor(
    @Inject(ACCESS_TOKEN_SERVICE)
    private accessTokenService: TokenService<JwtPayload>,
    @Inject(REFRESH_TOKEN_SERVICE)
    private refreshTokenService: TokenService<JwtPayload>,
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async refreshToken(
    accessToken: string,
    refreshToken: string,
  ): Promise<AuthOutDto> {
    if (!refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    let userId: number;

    try {
      const refreshTokenPayload =
        await this.refreshTokenService.verifyToken(refreshToken);

      userId = refreshTokenPayload.id;
    } catch (_e) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnknownUserError();
    }

    const newTokens = await this.authService.authenticateUser(user);

    await this.invalidateAccessToken(accessToken, user.id);
    await this.invalidateRefreshToken(refreshToken);

    return newTokens;
  }

  private async invalidateRefreshToken(refreshToken: string) {
    await this.refreshTokenService.invalidateToken(refreshToken);
    // TODO: Remove after testing e2e
    console.log('🔑❌ refreshToken', refreshToken);
  }

  private async invalidateAccessToken(accessToken: string, userId: number) {
    const accessTokenPayload = this.accessTokenService.decodeToken(accessToken);

    if (accessTokenPayload.id !== userId) {
      // access and refresh tokens belongs to different users
      // no need to invalidate access token
      return;
    }

    await this.accessTokenService.invalidateToken(accessToken);
    // TODO: Remove after testing e2e
    console.log('🔑❌ accessToken', accessToken);
  }
}
