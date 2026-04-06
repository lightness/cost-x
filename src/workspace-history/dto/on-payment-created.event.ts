import { Prisma } from '../../../generated/prisma/browser';
import Payment from '../../payment/entity/payment.entity';

export class OnPaymentCreatedEvent {
  workspaceId: number;
  actorId: number;
  payment: Payment;
  tx?: Prisma.TransactionClient;
}
