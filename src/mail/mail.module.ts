import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { providers } from './mail.providers';
import { MailService } from './mail.service';

@Module({
  exports: [MailService],
  imports: [ConfigModule],
  providers: [MailService, ...providers],
})
export class MailModule {}
