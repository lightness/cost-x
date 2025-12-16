import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Currency } from '../../database/entities/currency.enum';
import { Transform } from 'class-transformer';

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