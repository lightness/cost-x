import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/client';
import { DateScalar, DecimalScalar } from '../../graphql/scalar';
import { CostByCurrency } from '../../item-cost/dto/cost-by-currency.type';
import PaymentEntity from '../entity/payment.entity';

@ObjectType()
export class FindPaymentsAggregates {
  payments: PaymentEntity[];

  @Field(() => Int, { nullable: true })
  count?: number;

  @Field(() => CostByCurrency, { nullable: true })
  costByCurrency?: CostByCurrency;

  @Field(() => DecimalScalar, { nullable: true })
  costInDefaultCurrency?: Decimal;

  @Field(() => DateScalar, { nullable: true })
  firstPaymentDate?: Date;

  @Field(() => DateScalar, { nullable: true })
  lastPaymentDate?: Date;
}
