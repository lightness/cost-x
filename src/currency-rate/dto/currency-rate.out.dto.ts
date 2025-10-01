import { Currency } from '../../database/entities/currency.enum';

export class CurrencyRateOutDto {

  fromCurrency: Currency;

  toCurrency: Currency;

  date: string;

  rate: number;
}