import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { providers } from './mail.providers';

@Module({
  exports: [MailService],
  providers: [MailService, ...providers],
})
export class MailModule {}
