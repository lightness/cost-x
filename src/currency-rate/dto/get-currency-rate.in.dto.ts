import { ArgsType, Field } from '@nestjs/graphql';
import { IsDate, IsEnum } from 'class-validator';
import { DateScalar } from '../../graphql/scalar';
import { Currency } from '../entity/currency.enum';

@ArgsType()
export class GetCurrencyRateInDto {
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
