import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PasswordModule } from '../password/password.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { ResetPasswordService } from './reset-password.service';
import { ResetPasswordResolver } from './resolver/reset-password.resolver';
import { RESET_PASSWORD_TOKEN_SERVICE } from './symbols';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PasswordModule,
    TokenModule.register(RESET_PASSWORD_TOKEN_SERVICE, 'resetPassword.jwt'),
  ],
  providers: [ResetPasswordService, ResetPasswordResolver],
})
export class ResetPasswordModule {}
