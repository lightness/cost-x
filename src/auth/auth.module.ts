import { Module } from '@nestjs/common';
import { PasswordModule } from '../password/password.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthGuard } from './guard/auth.guard';
import { AuthResolver } from './resolver/auth.resolver';

@Module({
  imports: [PrismaModule, PasswordModule],
  providers: [AuthService, AuthResolver, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
