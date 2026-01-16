import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerSend } from 'mailersend';

export const providers: Provider[] = [
  {
    provide: MailerSend,
    useFactory: (configService: ConfigService) => {
      return new MailerSend({
        apiKey: configService.getOrThrow('mailersend.apiKey'),
      });
    },
    inject: [ConfigService],
  },
];
