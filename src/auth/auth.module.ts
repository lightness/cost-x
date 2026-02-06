import { Module } from '@nestjs/common';
import { PasswordModule } from '../password/password.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { TokenModule } from '../token/token.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieService } from './cookie.service';
import { AuthGuard } from './guard/auth.guard';
import { LogoutService } from './logout.service';
import { RefreshTokenService } from './refresh-token.service';
import { ACCESS_TOKEN_SERVICE, REFRESH_TOKEN_SERVICE } from './symbols';

@Module({
  controllers: [AuthController],
  exports: [
    AuthGuard,
    TokenModule.register(ACCESS_TOKEN_SERVICE, 'authenticate.access.jwt'),
  ],
  imports: [
    PrismaModule,
    PasswordModule,
    RedisModule,
    TokenModule.register(ACCESS_TOKEN_SERVICE, 'authenticate.access.jwt'),
    TokenModule.register(REFRESH_TOKEN_SERVICE, 'authenticate.refresh.jwt'),
  ],
  providers: [
    AuthService,
    AuthGuard,
    CookieService,
    RefreshTokenService,
    LogoutService,
  ],
})
export class AuthModule {}
