import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Currency } from '../../currency-rate/entities/currency.enum';

export class PaymentInDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  cost: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsDateString({ strict: true })
  @Transform(({ value }) => new Date(value))
  date: Date;
}