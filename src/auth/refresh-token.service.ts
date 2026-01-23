import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthOutDto, RefreshTokenInDto } from './dto';
import { ACCESS_TOKEN_SERVICE, REFRESH_TOKEN_SERVICE } from './symbols';
import { TokenService } from '../token/token.service';
import { JwtPayload } from './interfaces';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

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
    dto: RefreshTokenInDto,
  ): Promise<AuthOutDto> {
    const accessTokenPayload = this.accessTokenService.decodeToken(accessToken);
    const refreshTokenPayload = await this.refreshTokenService.verifyToken(
      dto.refreshToken,
    );

    if (accessTokenPayload.id !== refreshTokenPayload.id) {
      throw new UnauthorizedException(
        `Refresh token does not match access token`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: refreshTokenPayload.id,
      },
    });

    const newTokens = await this.authService.authenticateUser(user);

    await this.accessTokenService.invalidateToken(accessToken);
    await this.refreshTokenService.invalidateToken(dto.refreshToken);

    return newTokens;
  }
}
