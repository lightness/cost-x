import { ArgsType, Field } from '@nestjs/graphql';
import { IsDate, IsEnum } from 'class-validator';
import { DateScalar } from '../../graphql/scalars';
import { Currency } from '../entities/currency.enum';

@ArgsType()
export class GetCurrencyRateArgs {
  @Field(() => Currency)
  @IsEnum(Currency)
  fromCurrency: Currency;

  @Field(() => Currency)
  @IsEnum(Currency)
  toCurrency: Currency;

  @Field(() => DateScalar)
  @IsDate()
  date: Date;
}
