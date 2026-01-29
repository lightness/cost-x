import { Field, HideField, Int, ObjectType } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/client';
import { DateScalar, DecimalScalar } from '../../graphql/scalars';
import { CostByCurrency } from '../../item-cost/dto';
import { PaymentsFilter } from '../../payment/dto';

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
