import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/client';
import {
  type PaymentBalanceChange as PrismaPaymentBalanceChange,
  Currency,
} from '../../../generated/prisma/client';
import { DecimalScalar } from '../../graphql/scalar';

@ObjectType()
class PaymentBalanceChange implements PrismaPaymentBalanceChange {
  id: number;
  paymentId: number;
  createdAt: Date;
  updatedAt: Date;

  @Field(() => Int)
  workspaceMemberId: number;

  @Field(() => DecimalScalar)
  value: Decimal;

  @Field(() => Currency)
  currency: Currency;
}

export default PaymentBalanceChange;
