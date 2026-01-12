import { Injectable } from '@nestjs/common';
import { AccessTokenService } from './access-token.service';
import { LogoutInDto } from './dto';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class LogoutService {
  constructor(
    private accessTokenService: AccessTokenService,
    private refreshTokenService: RefreshTokenService,
  ) { }

  async logout(token: string, dto: LogoutInDto) {
    const [accessVerifyResult, refreshVerifyResult] = await Promise.allSettled([
      this.accessTokenService.verifyToken(token),
      this.refreshTokenService.verifyToken(dto.refreshToken),
    ]);

    if (accessVerifyResult.status === 'rejected' || refreshVerifyResult.status === 'rejected') {
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
      success: results.every(result => result.status === 'fulfilled'),
    }
  }
}
