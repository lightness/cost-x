import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CookieOptions, Request, Response } from 'express';
import { TokenService } from '../token/token.service';
import { JwtPayload } from './interfaces';
import { REFRESH_TOKEN_SERVICE } from './symbols';

@Injectable()
export class CookieService {
  constructor(
    @Inject(REFRESH_TOKEN_SERVICE)
    private refreshTokenService: TokenService<JwtPayload>,
  ) {}

  get refreshCookieNameForRefreshToken() {
    return 'refreshToken_refresh-token';
  }

  get refreshCookieNameForLogout() {
    return 'refreshToken_logout';
  }

  get refreshTokenPath() {
    return '/auth/refresh-token';
  }

  get logoutPath() {
    return '/auth/logout';
  }

  get basicCookieOptions(): Partial<CookieOptions> {
    return {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
    };
  }

  setRefreshTokenInCookie(res: Response, token: string) {
    const exp = this.refreshTokenService.getExp(token);

    if (!exp) {
      throw new InternalServerErrorException(
        `Expired at cannot be inferred from token`,
      );
    }

    const expires = new Date(exp * 1000);

    res.cookie(this.refreshCookieNameForRefreshToken, token, {
      ...this.basicCookieOptions,
      expires,
      path: this.refreshTokenPath,
    });
    // TODO: Remove after testing e2e
    console.log('🍪✅', this.refreshCookieNameForRefreshToken);

    res.cookie(this.refreshCookieNameForLogout, token, {
      ...this.basicCookieOptions,
      expires,
      path: this.logoutPath,
    });
    // TODO: Remove after testing e2e
    console.log('🍪✅', this.refreshCookieNameForLogout);
  }

  getRefreshTokenFromCookie(req: Request): string {
    return (
      req.cookies[this.refreshCookieNameForRefreshToken] ||
      req.cookies[this.refreshCookieNameForLogout]
    );
  }

  clearRefreshTokenFromCookie(res: Response) {
    res.clearCookie(this.refreshCookieNameForRefreshToken, {
      ...this.basicCookieOptions,
      path: this.refreshTokenPath,
    });
    // TODO: Remove after testing e2e
    console.log('🍪❌', this.refreshCookieNameForRefreshToken);

    res.clearCookie(this.refreshCookieNameForLogout, {
      ...this.basicCookieOptions,
      path: this.logoutPath,
    });
    // TODO: Remove after testing e2e
    console.log('🍪❌', this.refreshCookieNameForLogout);
  }
}
