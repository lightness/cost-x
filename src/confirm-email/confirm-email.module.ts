import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { ConfirmEmailService } from './confirm-email.service';
import { CONFIRM_EMAIL_TOKEN_SERVICE } from './symbols';
import { MailModule } from '../mail/mail.module';
import { ConfirmEmailController } from './confirm-email.controller';

@Module({
  controllers: [ConfirmEmailController],
  exports: [ConfirmEmailService],
  imports: [
    PrismaModule,
    TokenModule.register(CONFIRM_EMAIL_TOKEN_SERVICE, 'confirmEmail.jwt'),
    MailModule,
  ],
  providers: [ConfirmEmailService],
})
export class ConfirmEmailModule {}
