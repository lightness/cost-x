import { Injectable } from '@nestjs/common';
import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
import { MailParams } from './interfaces';

@Injectable()
export class MailService {
  constructor(private mailerSend: MailerSend) { }

  async send(params: MailParams) {
    const { toUser: { name, email }, subject, text } = params;

    const sentFrom = new Sender("no-reply@mailersend.net", "Cost-X");

    const recipients = [
      new Recipient(email, name)
    ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setText(text);

    await this.mailerSend.email.send(emailParams);
  }
}