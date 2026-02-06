import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CookieService } from './cookie.service';
import { Token } from './decorator/token.decorator';
import { AuthInDto, AuthOutDto, LogoutOutDto } from './dto';
import { AuthGuard } from './guard/auth.guard';
import { LogoutService } from './logout.service';
import { RefreshTokenService } from './refresh-token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
    private logoutService: LogoutService,
    private cookieService: CookieService,
  ) {}

  @Post('login')
  async authenticate(
    @Body() dto: AuthInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthOutDto> {
    const { refreshToken, ...result } =
      await this.authService.authenticate(dto);

    this.cookieService.setRefreshTokenInCookie(res, refreshToken);

    return result;
  }

  @Post('refresh-token')
  async refreshToken(
    @Token() accessToken: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthOutDto> {
    const refreshToken = this.cookieService.getRefreshTokenFromCookie(request);

    const { refreshToken: newRefreshToken, ...result } =
      await this.refreshTokenService.refreshToken(accessToken, refreshToken);

    this.cookieService.setRefreshTokenInCookie(response, newRefreshToken);

    return result;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Token() accessToken: string,
  ): Promise<LogoutOutDto> {
    const refreshToken = this.cookieService.getRefreshTokenFromCookie(request);

    const result = await this.logoutService.logout(accessToken, refreshToken);

    if (result.success) {
      this.cookieService.clearRefreshTokenFromCookie(response);
    }

    return result;
  }
}
