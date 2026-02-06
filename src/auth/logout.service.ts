import { Inject, Injectable } from '@nestjs/common';
import { TokenService } from '../token/token.service';
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
    const refreshTokenPayload =
      await this.refreshTokenService.verifyToken(refreshToken);

    await this.refreshTokenService.invalidateToken(refreshToken);

    return refreshTokenPayload.id;
  }

  private async invalidateAccessToken(accessToken: string, userId: number) {
    const accessTokenPayload = this.accessTokenService.decodeToken(accessToken);

    if (accessTokenPayload.id !== userId) {
      // refresh and access tokens belongs to different users
      // no need to invalidate access token
      return;
    }

    await this.accessTokenService.invalidateToken(accessToken);
  }
}
