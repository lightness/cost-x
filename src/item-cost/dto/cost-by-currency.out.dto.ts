import { Currency } from '../../currency-rate/entities/currency.enum';

export class CostByCurrencyOutDto {
  [Currency.BYN]: number;
  [Currency.EUR]: number;
  [Currency.USD]: number;
}
