import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AccessGuard } from '../../access/guard/access.guard';
import { AuthService } from '../auth.service';
import { Token } from '../decorator/token.decorator';
import { AuthInDto, AuthOutDto, LogoutInDto, LogoutOutDto } from '../dto';
import { AuthGuard } from '../guard/auth.guard';
import { LogoutService } from '../logout.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private logoutService: LogoutService,
  ) {}

  @Mutation(() => AuthOutDto)
  async authenticate(@Args('dto', { type: () => AuthInDto }) dto: AuthInDto): Promise<AuthOutDto> {
    return this.authService.authenticate(dto);
  }

  @Mutation(() => LogoutOutDto)
  async logout(
    @Args('dto', { type: () => LogoutInDto }) dto: LogoutInDto,
    @Token() accessToken: string,
  ): Promise<LogoutOutDto> {
    return this.logoutService.logout(accessToken, dto);
  }
}
