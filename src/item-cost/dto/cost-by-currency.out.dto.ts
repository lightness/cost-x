import { Currency } from '../../database/entities/currency.enum';

export class CostByCurrencyOutDto {
  [Currency.BYN]: number;
  [Currency.EUR]: number;
  [Currency.USD]: number;
}