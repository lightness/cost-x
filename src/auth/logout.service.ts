import { Inject, Injectable } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { InvalidRefreshTokenError } from './error/invalid-refresh-token.error';
import { JwtPayload } from './interfaces';
import { ACCESS_TOKEN_SERVICE, REFRESH_TOKEN_SERVICE } from './symbols';

@Injectable()
export class LogoutService {
  constructor(
    @Inject(ACCESS_TOKEN_SERVICE)
    private accessTokenService: TokenService<JwtPayload>,
    @Inject(REFRESH_TOKEN_SERVICE)
    private refreshTokenService: TokenService<JwtPayload>,
  ) {}

  async logout(accessToken: string, refreshToken: string) {
    const userId = await this.invalidateRefreshToken(refreshToken);

    await this.invalidateAccessToken(accessToken, userId);

    return { success: true };
  }

  private async invalidateRefreshToken(refreshToken: string): Promise<number> {
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

    await this.refreshTokenService.invalidateToken(refreshToken);

    return userId;
  }

  private async invalidateAccessToken(accessToken: string, userId: number) {
    if (!accessToken) {
      // accessToken is not provided
      // impossible to invalidate
      return;
    }

    const accessTokenPayload = this.accessTokenService.decodeToken(accessToken);

    if (accessTokenPayload.id !== userId) {
      // refresh and access tokens belongs to different users
      // no need to invalidate access token
      return;
    }

    await this.accessTokenService.invalidateToken(accessToken);
  }
}
