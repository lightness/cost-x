import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { Decimal } from '@prisma/client/runtime/client';
import type { CurrencyRate as PrismaCurrencyRate } from '../../../generated/prisma/client';
import { Currency } from '../entities/currency.enum';
import {
  DateIsoScalar,
  DateScalar,
  DecimalScalar,
} from '../../graphql/scalars';

@ObjectType()
class CurrencyRate implements PrismaCurrencyRate {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => Currency)
  fromCurrency: Currency;

  @Field(() => Currency)
  toCurrency: Currency;

  @Field(() => DateScalar)
  date: Date;

  @Field(() => DecimalScalar)
  rate: Decimal;
}

export default CurrencyRate;
