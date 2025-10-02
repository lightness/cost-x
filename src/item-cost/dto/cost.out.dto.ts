import { Currency } from '../../database/entities/currency.enum';

export class CostOutDto {
  cost: number;

  currency: Currency;
}