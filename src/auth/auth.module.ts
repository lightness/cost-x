import { Module } from '@nestjs/common';
import { PasswordModule } from '../password/password.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AccessTokenService } from './access-token.service';
import { AuthService } from './auth.service';
import { AuthGuard } from './guard/auth.guard';
import { LogoutService } from './logout.service';
import { RefreshTokenService } from './refresh-token.service';
import { AuthResolver } from './resolver/auth.resolver';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [PrismaModule, PasswordModule, RedisModule, AccessModule],
  providers: [
    AuthService, 
    AuthResolver, 
    AuthGuard,
    AccessTokenService,
    RefreshTokenService,
    LogoutService,
  ],
  exports: [AccessTokenService, AuthGuard],
})
export class AuthModule {}
