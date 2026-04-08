import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export const MAIL_TRANSPORTER = 'MAIL_TRANSPORTER';

export const providers: Provider[] = [
  {
    inject: [ConfigService],
    provide: MAIL_TRANSPORTER,
    useFactory: (configService: ConfigService) => {
      return nodemailer.createTransport({
        host: configService.getOrThrow('smtp.host'),
        port: configService.getOrThrow('smtp.port'),
      });
    },
  },
];
