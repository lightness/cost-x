import { Field, ObjectType } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/client';
import { DecimalScalar } from '../../graphql/scalars';
import { Currency } from '../../currency-rate/entities/currency.enum';

@ObjectType()
export class CostByCurrency {
  @Field(() => DecimalScalar)
  [Currency.BYN]: Decimal;

  @Field(() => DecimalScalar)
  [Currency.USD]: Decimal;

  @Field(() => DecimalScalar)
  [Currency.EUR]: Decimal;
}
