import { Field, ObjectType } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../../currency-rate/entity/currency.enum';
import { DecimalScalar } from '../../graphql/scalar';

@ObjectType()
export class CostByCurrency {
  @Field(() => DecimalScalar)
  [Currency.BYN]: Decimal;

  @Field(() => DecimalScalar)
  [Currency.USD]: Decimal;

  @Field(() => DecimalScalar)
  [Currency.EUR]: Decimal;
}
