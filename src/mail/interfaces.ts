import { User } from '../user/entities/user.entity';

export interface MailParams {
  toUser: User;
  subject: string;
  text?: string;
  html?: string;
}