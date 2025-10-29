import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Currency } from '../../database/entities/currency.enum';

export class PaymentInDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  cost: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsDateString({ strict: true })
  date: string;
}