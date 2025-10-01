import { Currency } from '../../database/entities/currency.enum';

export class CostOutDto {
  value: number;

  currency: Currency;
}