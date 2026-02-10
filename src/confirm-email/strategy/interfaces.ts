import { User } from '../../user/entity/user.entity';

export interface IConfirmEmailStrategy {
  initiateFlow(user: User): Promise<User>;
}
