import { Prisma } from '../../../generated/prisma/client';
import User from '../../user/entity/user.entity';

export interface IConfirmEmailStrategy {
  initiateFlow(user: User, tx?: Prisma.TransactionClient): Promise<User>;
}
