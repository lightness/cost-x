import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Currency } from '../../database/entities/currency.enum';
import { DateScalar } from '../scalars';

@ObjectType()
export class CurrencyRateEntity {
  @Field(() => Currency)
  fromCurrency: Currency;

  @Field(() => Currency)
  toCurrency: Currency;

  @Field(() => DateScalar)
  date: Date;

  @Field(() => Float)
  rate: number;
}