import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/client';
import { CurrencyRate as PrismaCurrencyRate } from '../../../generated/prisma/client';
import { DateIsoScalar, DateScalar, DecimalScalar } from '../../graphql/scalar';
import { Currency } from '../entity/currency.enum';

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
