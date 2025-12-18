import { Field, Float, HideField, Int, ObjectType } from '@nestjs/graphql';
import { PaymentsFilter } from '../../payment/dto';
import { DateScalar } from '../../graphql/scalars';
import { CostByCurrency } from '../../item-cost/dto';

@ObjectType()
export class PaymentsAggregation {
  @HideField()
  itemId: number;

  @HideField()
  paymentsFilter: PaymentsFilter;

  @Field(() => Int, { nullable: true })
  count?: number;

  @Field(() => Float, { nullable: true })
  costInDefaultCurrency?: number;

  @Field(() => CostByCurrency, { nullable: true })
  costByCurrency?: CostByCurrency;

  @Field(() => DateScalar, { nullable: true })
  firstPaymentDate?: Date;

  @Field(() => DateScalar, { nullable: true })
  lastPaymentDate?: Date;
}