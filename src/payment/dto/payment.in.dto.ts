import { Field, InputType } from '@nestjs/graphql';
import { Transform, Type } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/client';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { Currency } from '../../currency-rate/entity/currency.enum';
import { DateScalar, DecimalScalar } from '../../graphql/scalar';

@InputType()
export class PaymentInDto {
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  title?: string;

  @Type(() => Object)
  @Transform(({ obj, key }) => obj[key])
  @Field(() => DecimalScalar)
  cost: Decimal;

  @IsEnum(Currency)
  @Field(() => Currency)
  currency: Currency;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @Field(() => DateScalar)
  date: Date;
}
