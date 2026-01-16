import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
import { User } from '../user/entities/user.entity';
import { MailParams } from './interfaces';

@Injectable()
export class MailService {
  constructor(
    private mailerSend: MailerSend,
    private configService: ConfigService,
  ) {}

  private get sender() {
    const { email, name } = this.configService.getOrThrow('mailersend.sender');

    return new Sender(email, name);
  }

  private get confirmEmailLinkUrl() {
    const url = this.configService.getOrThrow(
      'mailersend.confirmEmail.linkUrl',
    );

    return url;
  }

  async send(params: MailParams) {
    const {
      toUser: { name, email },
      subject,
      text,
      html,
    } = params;

    const recipients = [new Recipient(email, name)];

    const emailParams = new EmailParams()
      .setFrom(this.sender)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    await this.mailerSend.email.send(emailParams);
  }

  async sendConfirmEmail(user: User, token: string) {
    const { name } = user;

    const url = `${this.confirmEmailLinkUrl}?token=${token}`;

    return this.send({
      toUser: user,
      subject: 'Welcome to Cost-X',
      html: [
        `<p>Hey, ${name}!</p>`,
        '<br/>',
        '<p>You are welcome to Cost-X.</p>',
        `<p>Click to confirm your email: <a href="${url}">LINK</a></p>`,
      ].join('\n'),
    });
  }
}
