import { Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';
import type { TokenService } from '../token/token.service';
import type { LogoutInDto } from './dto';
import { ACCESS_TOKEN_SERVICE, REFRESH_TOKEN_SERVICE } from './symbols';

@Injectable()
export class LogoutService {
  constructor(
    @Inject(ACCESS_TOKEN_SERVICE)
    private accessTokenService: TokenService<JwtPayload>,
    @Inject(REFRESH_TOKEN_SERVICE)
    private refreshTokenService: TokenService<JwtPayload>,
  ) {}

  async logout(token: string, dto: LogoutInDto) {
    const [accessVerifyResult, refreshVerifyResult] = await Promise.allSettled([
      this.accessTokenService.verifyToken(token),
      this.refreshTokenService.verifyToken(dto.refreshToken),
    ]);

    if (
      accessVerifyResult.status === 'rejected' ||
      refreshVerifyResult.status === 'rejected'
    ) {
      return { success: false };
    }

    const { value: accessTokenPayload } = accessVerifyResult;
    const { value: refreshTokenPayload } = refreshVerifyResult;

    if (accessTokenPayload.id !== refreshTokenPayload.id) {
      return { success: false };
    }

    const results = await Promise.allSettled([
      this.accessTokenService.invalidateToken(token),
      this.refreshTokenService.invalidateToken(dto.refreshToken),
    ]);

    return {
      success: results.every((result) => result.status === 'fulfilled'),
    };
  }
}
