import { Module } from '@nestjs/common';
import { ConfirmEmailModule } from '../confirm-email/confirm-email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ResetPasswordModule } from '../reset-password/reset-password.module';
import { ResendEmailService } from './resend-email.service';
import { ResendEmailResolver } from './resolver/resend-email.resolver';

@Module({
  imports: [PrismaModule, ResetPasswordModule, ConfirmEmailModule],
  providers: [ResendEmailService, ResendEmailResolver],
})
export class ResendEmailModule {}
