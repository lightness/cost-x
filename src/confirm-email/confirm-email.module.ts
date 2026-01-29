import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { ConfirmEmailController } from './confirm-email.controller';
import { ConfirmEmailService } from './confirm-email.service';
import { CONFIRM_EMAIL_TOKEN_SERVICE } from './symbols';

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
