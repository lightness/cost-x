import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { ConfirmEmailService } from './confirm-email.service';
import { AutoConfirmEmailService } from './strategy/auto/auto-confirm-email.service';
import { ManualConfirmEmailController } from './strategy/manual/manual-confirm-email.controller';
import { ManualConfirmEmailService } from './strategy/manual/manual-confirm-email.service';
import { CONFIRM_EMAIL_TOKEN_SERVICE } from './symbols';

@Module({
  controllers: [ManualConfirmEmailController],
  exports: [ConfirmEmailService],
  imports: [
    ConfigModule,
    PrismaModule,
    TokenModule.register(CONFIRM_EMAIL_TOKEN_SERVICE, 'confirmEmail.jwt'),
    MailModule,
  ],
  providers: [
    ConfirmEmailService,
    ManualConfirmEmailService,
    AutoConfirmEmailService,
  ],
})
export class ConfirmEmailModule {}
