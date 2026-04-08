import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter } from 'nodemailer';
import User from '../user/entity/user.entity';
import { MailParams } from './interfaces';
import { MAIL_TRANSPORTER } from './mail.providers';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORTER) private transporter: Transporter,
    private configService: ConfigService,
  ) {}

  private get sender() {
    const { email, name } = this.configService.getOrThrow('smtp.sender');

    return `"${name}" <${email}>`;
  }

  private get confirmEmailLinkUrl() {
    return this.configService.getOrThrow('confirmEmail.linkUrl');
  }

  private get resetPasswordLinkUrl() {
    return this.configService.getOrThrow('resetPassword.linkUrl');
  }

  private get emailInviteLinkUrl() {
    return this.configService.getOrThrow('emailInvite.linkUrl');
  }

  private get emailInviteRejectLinkUrl() {
    return this.configService.getOrThrow('emailInvite.rejectLinkUrl');
  }

  async send(params: MailParams) {
    const {
      toUser: { name, email },
      subject,
      html,
    } = params;

    await this.transporter.sendMail({
      from: this.sender,
      html,
      subject,
      to: `"${name}" <${email}>`,
    });
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

  async sendEmailInvite(invitee: User, inviteeEmail: string, inviter: User, token: string) {
    const acceptUrl = `${this.emailInviteLinkUrl}?token=${token}`;
    const rejectUrl = `${this.emailInviteRejectLinkUrl}?token=${token}`;

    return this.send({
      html: [
        `<p>Hey!</p>`,
        '<br/>',
        `<p>${inviter.name} has invited you to Cost-X.</p>`,
        `<p>Click to accept the invite and set up your account: <a href="${acceptUrl}">ACCEPT</a></p>`,
        `<p>Click to reject the invite: <a href="${rejectUrl}">REJECT</a></p>`,
        '<h3>DEV</h3>',
        `<p>Call "acceptEmailInvite" endpoint using following token: ${token}</p>`,
        `<p>Call "rejectEmailInvite" endpoint using following token: ${token}</p>`,
      ].join('\n'),
      subject: `${inviter.name} invited you to Cost-X`,
      toUser: { ...invitee, email: inviteeEmail },
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
