import { Field, Float, HideField, Int, ObjectType } from '@nestjs/graphql';
import { PaymentsFilter } from '../../payment/dto';
import { DateScalar, DecimalScalar } from '../../graphql/scalars';
import { CostByCurrency } from '../../item-cost/dto';
import { Decimal } from '@prisma/client/runtime/client';

@ObjectType()
export class PaymentsAggregation {
  @HideField()
  itemIds?: number[];

  @HideField()
  paymentsFilter: PaymentsFilter;

  @Field(() => Int, { nullable: true })
  count?: number;

  @Field(() => DecimalScalar, { nullable: true })
  costInDefaultCurrency?: Decimal;

  @Field(() => CostByCurrency, { nullable: true })
  costByCurrency?: CostByCurrency;

  @Field(() => DateScalar, { nullable: true })
  firstPaymentDate?: Date;

  @Field(() => DateScalar, { nullable: true })
  lastPaymentDate?: Date;
}