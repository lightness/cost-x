import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
import { User } from '../user/entity/user.entity';
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
    const url = this.configService.getOrThrow('confirmEmail.linkUrl');

    return url;
  }

  private get resetPasswordLinkUrl() {
    const url = this.configService.getOrThrow('resetPassword.linkUrl');

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
      html: [
        `<p>Hey, ${name}!</p>`,
        '<br/>',
        '<p>You are welcome to Cost-X.</p>',
        `<p>Click to confirm your email: <a href="${url}">LINK</a></p>`,
      ].join('\n'),
      subject: 'Welcome to Cost-X',
      toUser: user,
    });
  }

  async sendResetPassword(user: User, token: string) {
    const { name } = user;

    const url = `${this.resetPasswordLinkUrl}?token=${token}`;

    return this.send({
      html: [
        `<p>Hey, ${name}!</p>`,
        '<br/>',
        `<p>You've requested password reset on Cost-X.</p>`,
        '<h3>PROD (does not work)</h3>',
        `<p>Click to navigate to reset password page: <a href="${url}">LINK</a></p>`,
        '<h3>DEV</h3>',
        `<p>Call "resetPassword" mutation using following token: ${token}</p>`,
      ].join('\n'),
      subject: 'Reset password on Cost-X',
      toUser: user,
    });
  }
}
