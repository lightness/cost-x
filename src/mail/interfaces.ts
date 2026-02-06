import { User } from '../user/entity/user.entity';

export interface MailParams {
  toUser: User;
  subject: string;
  text?: string;
  html?: string;
}
