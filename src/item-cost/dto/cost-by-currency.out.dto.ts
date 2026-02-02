import { Currency } from '../../currency-rate/entity/currency.enum';

export class CostByCurrencyOutDto {
  [Currency.BYN]: number;
  [Currency.EUR]: number;
  [Currency.USD]: number;
}
