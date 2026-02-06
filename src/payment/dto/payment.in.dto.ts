import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Currency } from '../../currency-rate/entity/currency.enum';
import { DateScalar, DecimalScalar } from '../../graphql/scalar';

@InputType()
export class PaymentInDto {
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  title?: string;

  @IsNumber()
  @Field(() => DecimalScalar)
  cost: number;

  @IsEnum(Currency)
  @Field(() => Currency)
  currency: Currency;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @Field(() => DateScalar)
  date: Date;
}
