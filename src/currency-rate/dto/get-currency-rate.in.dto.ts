import { IsDateString, IsEnum, IsIn } from 'class-validator';
import { Currency } from '../../database/entities/currency.enum';

export class GetCurrencyRateInDto {
  @IsEnum(Currency)
  @IsIn([Currency.USD, Currency.EUR])
  fromCurrency: Currency;

  @IsEnum(Currency)
  @IsIn([Currency.BYN])
  toCurrency: Currency;

  @IsDateString({ strict: true })
  date: Date;
}