import { Prisma } from '../../../generated/prisma/browser';
import Payment from '../../payment/entity/payment.entity';

export class OnPaymentUpdatedEvent {
  workspaceId: number;
  actorId: number;
  oldPayment: Payment;
  newPayment: Payment;
  tx?: Prisma.TransactionClient;
}
