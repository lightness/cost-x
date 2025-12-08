import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import PaymentEntity from '../entities/payment.entity';
import { CostByCurrency } from '../../item-cost/dto/cost-by-currency.type';
import { DateScalar } from '../../graphql/scalars';

@ObjectType()
export class FindPaymentsAggregates {
  payments: PaymentEntity[];

  @Field(() => Int, { nullable: true })
  count?: number;

  @Field(() => CostByCurrency, { nullable: true })
  costByCurrency?: CostByCurrency;

  @Field(() => Float, { nullable: true })
  costInDefaultCurrency?: number;

  @Field(() => DateScalar, { nullable: true })
  firstPaymentDate?: Date;

  @Field(() => DateScalar, { nullable: true })
  lastPaymentDate?: Date;
}
