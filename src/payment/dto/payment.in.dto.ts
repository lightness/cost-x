import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Currency } from '../../currency-rate/entities/currency.enum';
import { Field, InputType } from '@nestjs/graphql';
import { DateScalar, DecimalScalar } from '../../graphql/scalars';

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
