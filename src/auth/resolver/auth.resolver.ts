import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { Token } from '../decorator/token.decorator';
import {
  AuthInDto,
  AuthOutDto,
  LogoutInDto,
  LogoutOutDto,
  RefreshTokenInDto,
} from '../dto';
import { AuthGuard } from '../guard/auth.guard';
import { LogoutService } from '../logout.service';
import { RefreshTokenService } from '../refresh-token.service';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
    private logoutService: LogoutService,
  ) {}

  @Mutation(() => AuthOutDto)
  async authenticate(
    @Args('dto', { type: () => AuthInDto }) dto: AuthInDto,
  ): Promise<AuthOutDto> {
    return this.authService.authenticate(dto);
  }

  @Mutation(() => AuthOutDto)
  async refreshToken(
    @Args('dto', { type: () => RefreshTokenInDto }) dto: RefreshTokenInDto,
    @Token() accessToken: string,
  ): Promise<AuthOutDto> {
    return this.refreshTokenService.refreshToken(accessToken, dto);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => LogoutOutDto)
  async logout(
    @Args('dto', { type: () => LogoutInDto }) dto: LogoutInDto,
    @Token() accessToken: string,
  ): Promise<LogoutOutDto> {
    return this.logoutService.logout(accessToken, dto);
  }
}
